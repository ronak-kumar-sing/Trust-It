import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import { TrustScoreCalculator } from '../../../domain/services/TrustScoreCalculator.js';
import type { TrustScoreResponseDTO } from '../../dtos/trustScore.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve trust score and tier analysis for a user.
 */
export class GetTrustScoreDetails {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<TrustScoreResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const details = TrustScoreCalculator.getDetails(user.trustScore);

    return {
      userId: user.id,
      score: details.score,
      tier: details.tier,
      maxEscrowAmount: details.maxEscrowAmount,
      nextTier: details.nextTier,
      pointsToNextTier: details.pointsToNextTier,
    };
  }
}
