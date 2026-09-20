import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { AdjustTrustScore } from './AdjustTrustScore.js';
import type { TrustScoreResponseDTO } from '../../dtos/trustScore.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Applies monthly inactivity score decay (-2 points).
 */
export class ApplyInactivityDecay {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adjustTrustScore: AdjustTrustScore,
  ) {}

  async execute(userId: string): Promise<TrustScoreResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return this.adjustTrustScore.execute({
      userId,
      adjustmentType: 'INACTIVITY_DECAY',
    });
  }
}
