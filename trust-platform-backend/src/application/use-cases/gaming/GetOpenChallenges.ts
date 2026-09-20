import type {
  IGamingChallengeRepository,
  ChallengeFilter,
} from '../../interfaces/IGamingChallengeRepository.js';
import type { GamingChallengeDTO } from '../../dtos/gaming.dto.js';

/**
 * Use case: List open gaming challenges for discovery/lobby.
 */
export class GetOpenChallenges {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
  ) {}

  async execute(filter?: ChallengeFilter): Promise<GamingChallengeDTO[]> {
    const challenges =
      await this.challengeRepository.findOpenChallenges(filter);

    return challenges.map((c) => ({
      id: c.id,
      challengerId: c.challengerId,
      opponentId: c.opponentId,
      gameTitle: c.gameTitle,
      stakeAmount: c.stakeAmount,
      totalPot: c.totalPot,
      rules: c.rules,
      status: c.status,
      escrowTransactionId: c.escrowTransactionId,
      responseDeadline: c.responseDeadline?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }
}
