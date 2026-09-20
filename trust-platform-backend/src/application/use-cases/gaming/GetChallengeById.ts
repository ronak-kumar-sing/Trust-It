import type { IGamingChallengeRepository } from '../../interfaces/IGamingChallengeRepository.js';
import type { IMatchResultRepository } from '../../interfaces/IMatchResultRepository.js';
import type { GamingChallengeDTO } from '../../dtos/gaming.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Fetch challenge details including all reported match results.
 */
export class GetChallengeById {
  constructor(
    private readonly challengeRepository: IGamingChallengeRepository,
    private readonly matchResultRepository: IMatchResultRepository,
  ) {}

  async execute(challengeId: string): Promise<GamingChallengeDTO> {
    const challenge = await this.challengeRepository.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('GamingChallenge', challengeId);
    }

    const matchResults =
      await this.matchResultRepository.findByChallengeId(challengeId);

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
      matchResults: matchResults.map((r) => ({
        id: r.id,
        challengeId: r.challengeId,
        reporterId: r.reporterId,
        claimedWinnerId: r.claimedWinnerId,
        evidenceUrl: r.evidenceUrl,
        verificationStatus: r.verificationStatus,
        aiConfidence: r.aiConfidence,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: challenge.createdAt.toISOString(),
      updatedAt: challenge.updatedAt.toISOString(),
    };
  }
}
