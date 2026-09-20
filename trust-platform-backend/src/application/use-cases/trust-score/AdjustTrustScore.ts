import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import { TrustScoreCalculator } from '../../../domain/services/TrustScoreCalculator.js';
import type {
  AdjustTrustScoreDTO,
  TrustScoreResponseDTO,
} from '../../dtos/trustScore.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Event-driven trust score adjustments.
 * Applies delta for completed escrows, dispute outcomes, KYC verifications, or inactivity decay.
 */
export class AdjustTrustScore {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: AdjustTrustScoreDTO): Promise<TrustScoreResponseDTO> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User', dto.userId);
    }

    const previousScore = user.trustScore;
    const newScore = TrustScoreCalculator.calculateNewScore(
      previousScore,
      dto.adjustmentType,
    );

    user.updateTrustScore(newScore);
    await this.userRepository.update(user);

    await this.auditLogger.log({
      entity: 'user',
      entityId: user.id,
      action: 'TRUST_SCORE_ADJUSTED',
      actorId: 'SYSTEM_TRUST_ENGINE',
      metadata: {
        adjustmentType: dto.adjustmentType,
        previousScore,
        newScore,
        referenceId: dto.referenceId ?? null,
      },
    });

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
