import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { FreezeForEscrow } from '../wallet/FreezeForEscrow.js';
import type { CreateEscrow } from '../escrow/CreateEscrow.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type {
  AcceptChallengeDTO,
  AcceptChallengeResultDTO,
} from '../../dtos/gaming.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Opponent accepts gaming challenge.
 * Freezes opponent stake into escrow, creates GAMING_WAGER escrow transaction with combined pot,
 * and sets challenge to ACCEPTED.
 */
export class AcceptChallenge {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly freezeForEscrow: FreezeForEscrow,
    private readonly createEscrow: CreateEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: AcceptChallengeDTO): Promise<AcceptChallengeResultDTO> {
    const challenge = await this.challengeRepository.findById(dto.challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', dto.challengeId);
    }

    if (challenge.status !== 'OPEN') {
      throw new ConflictError(
        `Challenge cannot be accepted in status: ${challenge.status}`,
      );
    }

    if (challenge.challengerId === dto.opponentId) {
      throw new ForbiddenError('Challenger cannot accept their own challenge');
    }

    if (challenge.opponentId && challenge.opponentId !== dto.opponentId) {
      throw new ForbiddenError(
        'This challenge is reserved for another specific opponent',
      );
    }

    // 1. Freeze opponent stake in wallet
    await this.freezeForEscrow.execute({
      userId: dto.opponentId,
      amount: challenge.stakeAmount,
      escrowTransactionId: `challenge-prep-${challenge.id}`,
    });

    // 2. Create Escrow contract with total pot (challenger stake + opponent stake)
    const escrow = await this.createEscrow.execute({
      buyerId: challenge.challengerId,
      sellerId: dto.opponentId,
      type: 'GAMING_WAGER',
      amount: challenge.totalPot,
      metadata: {
        challengeId: challenge.id,
        gameTitle: challenge.gameTitle,
        stakeAmount: challenge.stakeAmount,
      },
    });

    // Advance escrow to FUNDED_IN_ESCROW since both stakes are already verified & frozen
    const escrowEntity = await this.escrowRepository.findById(escrow.id);
    if (escrowEntity) {
      escrowEntity.transition('FUNDED_IN_ESCROW', dto.opponentId);
      await this.escrowRepository.save(escrowEntity);
    }

    // 3. Mark challenge as ACCEPTED
    challenge.accept(dto.opponentId, escrow.id);
    await this.challengeRepository.update(challenge);

    // 4. Audit log
    await this.auditLogger.log({
      entity: 'gaming_challenge',
      entityId: challenge.id,
      action: 'CHALLENGE_ACCEPTED',
      actorId: dto.opponentId,
      metadata: {
        escrowTransactionId: escrow.id,
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
        responseDeadline: challenge.responseDeadline?.toISOString() ?? null,
        createdAt: challenge.createdAt.toISOString(),
        updatedAt: challenge.updatedAt.toISOString(),
      },
      escrow: {
        ...escrow,
        status: 'FUNDED_IN_ESCROW',
      },
    };
  }
}
