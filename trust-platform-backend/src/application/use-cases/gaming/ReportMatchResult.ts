import { MatchResult } from '../../../domain/entities/MatchResult.js';
import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IMatchResultRepository } from '../../interfaces/IMatchResultRepository.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import type {
  ReportMatchResultDTO,
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
 * Use case: Player reports match outcome with optional scoreboard screenshot evidence.
 * Handles dual consensus auto-settlement or dispute escalation when reports conflict.
 */
export class ReportMatchResult {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly matchResultRepository: IMatchResultRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: ReportMatchResultDTO): Promise<SettlementResultDTO> {
    const challenge = await this.challengeRepository.findById(dto.challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', dto.challengeId);
    }

    if (!challenge.opponentId) {
      throw new ValidationError('Challenge must be accepted before reporting results');
    }

    // Verify reporter is a participant
    if (
      dto.reporterId !== challenge.challengerId &&
      dto.reporterId !== challenge.opponentId
    ) {
      throw new ForbiddenError('Only match participants can report results');
    }

    // Verify claimed winner is a participant
    if (
      dto.claimedWinnerId !== challenge.challengerId &&
      dto.claimedWinnerId !== challenge.opponentId
    ) {
      throw new ValidationError('Claimed winner must be one of the match participants');
    }

    // Check status
    if (
      challenge.status !== 'ACCEPTED' &&
      challenge.status !== 'IN_PROGRESS' &&
      challenge.status !== 'RESULTS_REPORTED'
    ) {
      throw new ConflictError(
        `Cannot report result for challenge with status: ${challenge.status}`,
      );
    }

    // Check if player has already reported
    const existingResults =
      await this.matchResultRepository.findByChallengeId(challenge.id);
    const alreadyReported = existingResults.some(
      (r) => r.reporterId === dto.reporterId,
    );
    if (alreadyReported) {
      throw new ConflictError('You have already submitted a result for this match');
    }

    // 1. Create and save new MatchResult
    const matchResult = MatchResult.create({
      challengeId: challenge.id,
      reporterId: dto.reporterId,
      claimedWinnerId: dto.claimedWinnerId,
      evidenceUrl: dto.evidenceUrl,
    });
    await this.matchResultRepository.create(matchResult);

    const allResults = [...existingResults, matchResult];

    // ── CASE 1: First Report Received ────────────────────────────
    if (allResults.length === 1) {
      // 30-minute opponent response window
      const deadline = new Date(Date.now() + 30 * 60 * 1000);
      challenge.reportFirstResult(deadline);
      await this.challengeRepository.update(challenge);

      await this.auditLogger.log({
        entity: 'gaming_challenge',
        entityId: challenge.id,
        action: 'FIRST_RESULT_REPORTED',
        actorId: dto.reporterId,
        metadata: {
          claimedWinnerId: dto.claimedWinnerId,
          responseDeadline: deadline.toISOString(),
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
          responseDeadline: challenge.responseDeadline?.toISOString() ?? null,
          createdAt: challenge.createdAt.toISOString(),
          updatedAt: challenge.updatedAt.toISOString(),
        },
        settlementScenario: 'FIRST_REPORT_AWAITING_OPPONENT',
        winnerId: null,
        payoutAmount: 0,
        platformFee: 0,
      };
    }

    // ── CASE 2: Both Players Have Reported ───────────────────────
    const reportA = allResults[0];
    const reportB = allResults[1];
    if (!reportA || !reportB) {
      throw new ValidationError(
        'Two match reports are required for settlement evaluation',
      );
    }

    const isConsensus = reportA.claimedWinnerId === reportB.claimedWinnerId;

    if (isConsensus) {
      // ── Scenarios 1 & 2: Dual Consensus Reached ─────────────────
      const winnerId = reportA.claimedWinnerId;
      challenge.reachConsensus();
      challenge.complete();
      await this.challengeRepository.update(challenge);

      // Financial Settlement: 5% platform fee
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

      const opponentWallet = await this.walletRepository.findByUserId(
        challenge.opponentId,
      );
      if (opponentWallet) {
        opponentWallet.debitFrozen(challenge.stakeAmount);
        await this.walletRepository.save(opponentWallet);
      }

      // 2. Credit net pot to winner wallet
      const winnerWallet = await this.walletRepository.findByUserId(winnerId);
      if (winnerWallet) {
        winnerWallet.credit(netPayout);
        await this.walletRepository.save(winnerWallet);

        // Ledger: payout
        const payoutLedger = TransactionLedger.create({
          walletId: winnerWallet.id,
          type: 'ESCROW_RELEASE',
          amount: netPayout,
          balanceAfter: winnerWallet.availableBalance,
          referenceId: challenge.id,
          description: `Gaming wager pot won for match ${challenge.id} (Gross: ₹${challenge.totalPot / 100}, Fee: ₹${feeAmount / 100})`,
        });
        await this.ledgerRepository.create(payoutLedger);

        // Ledger: platform fee
        const feeLedger = TransactionLedger.create({
          walletId: winnerWallet.id,
          type: 'PLATFORM_FEE',
          amount: feeAmount,
          balanceAfter: winnerWallet.availableBalance,
          referenceId: challenge.id,
          description: `Platform fee for gaming wager ${challenge.id}`,
        });
        await this.ledgerRepository.create(feeLedger);
      }

      // 3. Mark Escrow as RELEASED if active
      if (challenge.escrowTransactionId) {
        const escrow = await this.escrowRepository.findById(
          challenge.escrowTransactionId,
        );
        if (escrow && escrow.status !== 'RELEASED') {
          if (escrow.status === 'FUNDED_IN_ESCROW') {
            escrow.transition('DELIVERED', 'SYSTEM_CONSENSUS');
            escrow.transition('INSPECTION_PERIOD', 'SYSTEM_CONSENSUS');
          }
          if (
            escrow.status === 'INSPECTION_PERIOD' ||
            escrow.status === 'DISPUTED'
          ) {
            escrow.transition('RELEASED', 'SYSTEM_CONSENSUS');
          }
          await this.escrowRepository.save(escrow);
        }
      }

      await this.auditLogger.log({
        entity: 'gaming_challenge',
        entityId: challenge.id,
        action: 'MATCH_SETTLED_DUAL_CONSENSUS',
        actorId: dto.reporterId,
        metadata: {
          winnerId,
          totalPot: challenge.totalPot,
          feeAmount,
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
        settlementScenario: 'DUAL_CONSENSUS',
        winnerId,
        payoutAmount: netPayout,
        platformFee: feeAmount,
      };
    } else {
      // ── Conflicting Reports -> Escalate to Dispute ──────────────
      challenge.dispute();
      await this.challengeRepository.update(challenge);

      if (challenge.escrowTransactionId) {
        const escrow = await this.escrowRepository.findById(
          challenge.escrowTransactionId,
        );
        if (escrow) {
          if (escrow.status === 'FUNDED_IN_ESCROW') {
            escrow.transition('DELIVERED', dto.reporterId);
            escrow.transition('INSPECTION_PERIOD', dto.reporterId);
          }
          if (escrow.status === 'INSPECTION_PERIOD') {
            escrow.transition('DISPUTED', dto.reporterId);
          }
          await this.escrowRepository.save(escrow);
        }
      }

      await this.auditLogger.log({
        entity: 'gaming_challenge',
        entityId: challenge.id,
        action: 'MATCH_DISPUTED_CONFLICTING_REPORTS',
        actorId: dto.reporterId,
        metadata: {
          reportA: { reporterId: reportA.reporterId, claimedWinnerId: reportA.claimedWinnerId },
          reportB: { reporterId: reportB.reporterId, claimedWinnerId: reportB.claimedWinnerId },
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
        settlementScenario: 'CONFLICTING_REPORTS_DISPUTED',
        winnerId: null,
        payoutAmount: 0,
        platformFee: 0,
      };
    }
  }
}
