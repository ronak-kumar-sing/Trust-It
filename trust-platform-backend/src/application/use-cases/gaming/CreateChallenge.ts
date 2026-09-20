import { GamingChallenge } from '../../../domain/entities/GamingChallenge.js';
import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { FreezeForEscrow } from '../wallet/FreezeForEscrow.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type {
  CreateChallengeDTO,
  GamingChallengeDTO,
} from '../../dtos/gaming.dto.js';

/**
 * Use case: Challenger creates a new gaming challenge.
 * Freezes the challenger's stake in their wallet and saves the challenge in OPEN status.
 */
export class CreateChallenge {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly freezeForEscrow: FreezeForEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: CreateChallengeDTO): Promise<GamingChallengeDTO> {
    const challenge = GamingChallenge.create({
      challengerId: dto.challengerId,
      opponentId: dto.opponentId,
      gameTitle: dto.gameTitle,
      stakeAmount: dto.stakeAmount,
      rules: dto.rules,
    });

    // 1. Freeze challenger's stake in wallet
    await this.freezeForEscrow.execute({
      userId: dto.challengerId,
      amount: dto.stakeAmount,
      escrowTransactionId: `challenge-prep-${challenge.id}`,
    });

    // 2. Persist challenge
    await this.challengeRepository.create(challenge);

    // 3. Emit audit log
    await this.auditLogger.log({
      entity: 'gaming_challenge',
      entityId: challenge.id,
      action: 'CHALLENGE_CREATED',
      actorId: dto.challengerId,
      metadata: {
        gameTitle: challenge.gameTitle,
        stakeAmount: challenge.stakeAmount,
        totalPot: challenge.totalPot,
      },
    });

    return {
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
    };
  }
}
