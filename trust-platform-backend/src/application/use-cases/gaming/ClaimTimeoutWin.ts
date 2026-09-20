import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IMatchResultRepository } from '../../interfaces/IMatchResultRepository.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import type {
  ClaimTimeoutWinDTO,
  SettlementResultDTO,
} from '../../dtos/gaming.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../../shared/errors/index.js';
import { PLATFORM_FEES } from '../../../shared/constants/index.js';

/**
 * Use case: Participant claims auto-win when opponent fails to respond within 30 minutes.
 * Scenario 3: One-sided timeout auto-settlement.
 */
export class ClaimTimeoutWin {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly matchResultRepository: IMatchResultRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: ClaimTimeoutWinDTO): Promise<SettlementResultDTO> {
    const challenge = await this.challengeRepository.findById(dto.challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', dto.challengeId);
    }

    if (challenge.status !== 'RESULTS_REPORTED') {
      throw new ConflictError(
        `Cannot claim timeout on challenge with status: ${challenge.status}`,
      );
    }

    // Verify 30-minute response deadline has expired
    if (!challenge.isResponseExpired()) {
      throw new ValidationError(
        'Opponent response window is still active. Timeout cannot be claimed yet.',
      );
    }

    // Get the single report submitted
    const results = await this.matchResultRepository.findByChallengeId(challenge.id);
    if (results.length !== 1) {
      throw new ConflictError(
        'Timeout can only be claimed when exactly one report exists',
      );
    }

    const firstReport = results[0];
    if (!firstReport) {
      throw new NotFoundError('MatchResult for challenge', challenge.id);
    }

    if (firstReport.reporterId !== dto.reporterId) {
      throw new ForbiddenError(
        'Only the player who reported the initial result can claim a timeout win',
      );
    }

    const winnerId = firstReport.claimedWinnerId;

    // Transition challenge to COMPLETED
    challenge.complete();
    await this.challengeRepository.update(challenge);

    // Calculate payout
    const feeAmount = Math.round(
      (challenge.totalPot * PLATFORM_FEES.STANDARD) / 10000,
    );
    const netPayout = challenge.totalPot - feeAmount;

    // 1. Debit frozen stakes from both participants
    const challengerWallet = await this.walletRepository.findByUserId(
      challenge.challengerId,
    );
    if (challengerWallet) {
      challengerWallet.debitFrozen(challenge.stakeAmount);
      await this.walletRepository.save(challengerWallet);
    }

    if (challenge.opponentId) {
      const opponentWallet = await this.walletRepository.findByUserId(
        challenge.opponentId,
      );
      if (opponentWallet) {
        opponentWallet.debitFrozen(challenge.stakeAmount);
        await this.walletRepository.save(opponentWallet);
      }
    }

    // 2. Credit winner wallet
    const winnerWallet = await this.walletRepository.findByUserId(winnerId);
    if (winnerWallet) {
      winnerWallet.credit(netPayout);
      await this.walletRepository.save(winnerWallet);

      const payoutLedger = TransactionLedger.create({
        walletId: winnerWallet.id,
        type: 'ESCROW_RELEASE',
        amount: netPayout,
        balanceAfter: winnerWallet.availableBalance,
        referenceId: challenge.id,
        description: `Gaming wager pot won by opponent timeout (Gross: ₹${challenge.totalPot / 100}, Fee: ₹${feeAmount / 100})`,
      });
      await this.ledgerRepository.create(payoutLedger);

      const feeLedger = TransactionLedger.create({
        walletId: winnerWallet.id,
        type: 'PLATFORM_FEE',
        amount: feeAmount,
        balanceAfter: winnerWallet.availableBalance,
        referenceId: challenge.id,
        description: `Platform fee for gaming wager timeout ${challenge.id}`,
      });
      await this.ledgerRepository.create(feeLedger);
    }

    // 3. Mark Escrow as RELEASED
    if (challenge.escrowTransactionId) {
      const escrow = await this.escrowRepository.findById(
        challenge.escrowTransactionId,
      );
      if (escrow && escrow.status !== 'RELEASED') {
        if (escrow.status === 'FUNDED_IN_ESCROW') {
          escrow.transition('DELIVERED', 'SYSTEM_TIMEOUT');
          escrow.transition('INSPECTION_PERIOD', 'SYSTEM_TIMEOUT');
        }
        if (escrow.status === 'INSPECTION_PERIOD') {
          escrow.transition('RELEASED', 'SYSTEM_TIMEOUT');
        }
        await this.escrowRepository.save(escrow);
      }
    }

    await this.auditLogger.log({
      entity: 'gaming_challenge',
      entityId: challenge.id,
      action: 'MATCH_SETTLED_ONE_SIDED_TIMEOUT',
      actorId: dto.reporterId,
      metadata: {
        winnerId,
        totalPot: challenge.totalPot,
        netPayout,
      },
    });

    return {
      challenge: {
        id: challenge.id,
        challengerId: challenge.challengerId,
        opponentId: challenge.opponentId,
        gameTitle: challenge.gameTitle,
        stakeAmount: challenge.stakeAmount,
        totalPot: challenge.totalPot,
        rules: challenge.rules,
        status: challenge.status,
        escrowTransactionId: challenge.escrowTransactionId,
        responseDeadline: null,
        createdAt: challenge.createdAt.toISOString(),
        updatedAt: challenge.updatedAt.toISOString(),
      },
      settlementScenario: 'ONE_SIDED_TIMEOUT',
      winnerId,
      payoutAmount: netPayout,
      platformFee: feeAmount,
    };
  }
}
