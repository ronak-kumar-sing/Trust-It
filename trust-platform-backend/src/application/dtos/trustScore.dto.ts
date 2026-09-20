import type { TrustTierName } from '../../domain/services/TrustScoreCalculator.js';
import type { TRUST_SCORE_ADJUSTMENTS } from '../../shared/constants/index.js';

export interface TrustScoreResponseDTO {
  userId: string;
  score: number;
  tier: TrustTierName;
  maxEscrowAmount: number;
  nextTier: TrustTierName | null;
  pointsToNextTier: number;
}

export interface AdjustTrustScoreDTO {
  userId: string;
  adjustmentType: keyof typeof TRUST_SCORE_ADJUSTMENTS;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}
