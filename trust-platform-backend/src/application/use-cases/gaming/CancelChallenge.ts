import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type {
  CancelChallengeDTO,
  SettlementResultDTO,
} from '../../dtos/gaming.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Cancel gaming challenge.
 * Scenario 6: Mutual cancellation (or single-party cancellation if challenge is still OPEN).
 * Fully refunds both participants' locked stakes back to available balance.
 */
export class CancelChallenge {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: CancelChallengeDTO): Promise<SettlementResultDTO> {
    const challenge = await this.challengeRepository.findById(dto.challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', dto.challengeId);
    }

    // Verify caller is a participant
    if (
      dto.userId !== challenge.challengerId &&
      dto.userId !== challenge.opponentId
    ) {
      throw new ForbiddenError('Only match participants can cancel a challenge');
    }

    if (challenge.status !== 'OPEN' && challenge.status !== 'ACCEPTED') {
      throw new ConflictError(
        `Challenge in status '${challenge.status}' cannot be cancelled`,
      );
    }

    // 1. Refund challenger's stake
    const challengerWallet = await this.walletRepository.findByUserId(
      challenge.challengerId,
    );
    if (challengerWallet) {
      challengerWallet.refund(challenge.stakeAmount);
      await this.walletRepository.save(challengerWallet);
    }

    // 2. Refund opponent's stake if challenge was accepted
    if (challenge.status === 'ACCEPTED' && challenge.opponentId) {
      const opponentWallet = await this.walletRepository.findByUserId(
        challenge.opponentId,
      );
      if (opponentWallet) {
        opponentWallet.refund(challenge.stakeAmount);
        await this.walletRepository.save(opponentWallet);
      }
    }

    // 3. Mark Escrow as CANCELLED if exists
    if (challenge.escrowTransactionId) {
      const escrow = await this.escrowRepository.findById(
        challenge.escrowTransactionId,
      );
      if (escrow && escrow.status !== 'CANCELLED') {
        escrow.transition('CANCELLED', dto.userId);
        await this.escrowRepository.save(escrow);
      }
    }

    // 4. Mark challenge as CANCELLED
    challenge.cancel();
    await this.challengeRepository.update(challenge);

    await this.auditLogger.log({
      entity: 'gaming_challenge',
      entityId: challenge.id,
      action: 'CHALLENGE_CANCELLED_REFUNDED',
      actorId: dto.userId,
      metadata: {
        stakeAmount: challenge.stakeAmount,
        totalPot: challenge.totalPot,
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
      settlementScenario: 'MUTUAL_CANCELLATION',
      winnerId: null,
      payoutAmount: 0,
      platformFee: 0,
    };
  }
}
