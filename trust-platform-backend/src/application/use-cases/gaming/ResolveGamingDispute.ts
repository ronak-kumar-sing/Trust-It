import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IMatchVerifier } from '../../interfaces/IMatchVerifier.js';
import type { IMatchResultRepository } from '../../interfaces/IMatchResultRepository.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import type {
  ResolveGamingDisputeDTO,
  SettlementResultDTO,
} from '../../dtos/gaming.dto.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../shared/errors/index.js';
import { PLATFORM_FEES } from '../../../shared/constants/index.js';

/**
 * Use case: Resolves a disputed match (Scenarios 4 & 5).
 * Evaluates screenshot evidence using IMatchVerifier, applies 10% slash penalty to fraudulent parties,
 * and distributes pot to the authenticated winner.
 */
export class ResolveGamingDispute {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly matchResultRepository: IMatchResultRepository,
    private readonly matchVerifier: IMatchVerifier,
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: ResolveGamingDisputeDTO): Promise<SettlementResultDTO> {
    const challenge = await this.challengeRepository.findById(dto.challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', dto.challengeId);
    }

    if (challenge.status !== 'DISPUTED') {
      throw new ConflictError(
        `Cannot resolve challenge that is not in DISPUTED status (current: ${challenge.status})`,
      );
    }

    if (
      dto.resolvedWinnerId !== challenge.challengerId &&
      dto.resolvedWinnerId !== challenge.opponentId
    ) {
      throw new ValidationError('Resolved winner must be a match participant');
    }

    // Inspect match evidence with MatchVerifier
    const results = await this.matchResultRepository.findByChallengeId(
      challenge.id,
    );

    let fraudDetected = dto.slashFraudulentStake ?? false;
    let fraudulentUserId = dto.fraudulentPartyId ?? null;

    for (const res of results) {
      if (res.evidenceUrl) {
        const verification = await this.matchVerifier.verifyEvidence(
          res.evidenceUrl,
          res.claimedWinnerId,
          challenge.id,
        );

        res.setVerification(
          verification.isFraudulent ? 'REJECTED' : 'VERIFIED',
          verification.confidence,
        );
        await this.matchResultRepository.update(res);

        if (verification.isFraudulent) {
          fraudDetected = true;
          fraudulentUserId = res.reporterId;
        }
      }
    }

    // Determine fraudulent party if fraud is flagged and not explicitly assigned
    if (fraudDetected && !fraudulentUserId) {
      fraudulentUserId =
        dto.resolvedWinnerId === challenge.challengerId
          ? challenge.opponentId
          : challenge.challengerId;
    }

    // 1. Calculate Payouts & Fees
    const feeAmount = Math.round(
      (challenge.totalPot * PLATFORM_FEES.STANDARD) / 10000,
    );
    const netPayout = challenge.totalPot - feeAmount;

    // 2. Debit frozen stakes from both participants
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

    // 3. Apply 10% slash penalty if fraud was detected
    let slashedAmount = 0;
    if (fraudDetected && fraudulentUserId) {
      slashedAmount = Math.round(
        (challenge.stakeAmount * PLATFORM_FEES.SLASH_PENALTY) / 10000,
      );
      const fraudWallet = await this.walletRepository.findByUserId(
        fraudulentUserId,
      );
      if (fraudWallet && fraudWallet.availableBalance >= slashedAmount) {
        fraudWallet.debit(slashedAmount);
        await this.walletRepository.save(fraudWallet);

        const slashLedger = TransactionLedger.create({
          walletId: fraudWallet.id,
          type: 'SLASH_PENALTY',
          amount: slashedAmount,
          balanceAfter: fraudWallet.availableBalance,
          referenceId: challenge.id,
          description: `10% slash penalty applied for fraudulent evidence in challenge ${challenge.id}`,
        });
        await this.ledgerRepository.create(slashLedger);
      }
    }

    // 4. Credit winner wallet
    const winnerWallet = await this.walletRepository.findByUserId(
      dto.resolvedWinnerId,
    );
    if (winnerWallet) {
      winnerWallet.credit(netPayout);
      await this.walletRepository.save(winnerWallet);

      const payoutLedger = TransactionLedger.create({
        walletId: winnerWallet.id,
        type: 'ESCROW_RELEASE',
        amount: netPayout,
        balanceAfter: winnerWallet.availableBalance,
        referenceId: challenge.id,
        description: `Dispute payout won for challenge ${challenge.id}`,
      });
      await this.ledgerRepository.create(payoutLedger);
    }

    // 5. Complete Challenge & Release Escrow
    challenge.complete();
    await this.challengeRepository.update(challenge);

    if (challenge.escrowTransactionId) {
      const escrow = await this.escrowRepository.findById(
        challenge.escrowTransactionId,
      );
      if (escrow && escrow.status !== 'RELEASED') {
        if (escrow.status === 'FUNDED_IN_ESCROW') {
          escrow.transition('DELIVERED', dto.adminId);
          escrow.transition('INSPECTION_PERIOD', dto.adminId);
          escrow.transition('DISPUTED', dto.adminId);
        }
        if (escrow.status === 'INSPECTION_PERIOD') {
          escrow.transition('DISPUTED', dto.adminId);
        }
        if (escrow.status === 'DISPUTED') {
          escrow.transition('RELEASED', dto.adminId);
        }
        await this.escrowRepository.save(escrow);
      }
    }

    await this.auditLogger.log({
      entity: 'gaming_challenge',
      entityId: challenge.id,
      action: 'DISPUTE_RESOLVED',
      actorId: dto.adminId,
      metadata: {
        winnerId: dto.resolvedWinnerId,
        fraudDetected,
        fraudulentUserId,
        slashedAmount,
        netPayout,
      },
    });

    const scenario =
      dto.resolvedWinnerId === challenge.challengerId
        ? 'DISPUTE_RESOLVED_CHALLENGER'
        : 'DISPUTE_RESOLVED_OPPONENT';

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
      settlementScenario: scenario,
      winnerId: dto.resolvedWinnerId,
      payoutAmount: netPayout,
      platformFee: feeAmount,
      slashedAmount,
    };
  }
}
