import {
  TRUST_SCORE_ADJUSTMENTS,
  TRUST_TIERS,
} from '../../shared/constants/index.js';

export type TrustTierName = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TrustScoreDetails {
  score: number;
  tier: TrustTierName;
  maxEscrowAmount: number;
  nextTier: TrustTierName | null;
  pointsToNextTier: number;
}

/**
 * Domain Service: Trust Score & Tier Calculator.
 * Evaluates tiers, maximum escrow contract allowances, and adjustment calculations.
 */
export class TrustScoreCalculator {
  /**
   * Computes tier, max single-transaction escrow limit, and progression metrics.
   *
   * @param score - Raw trust score (0 - 100)
   * @returns Detailed tier analysis
   */
  static getDetails(score: number): TrustScoreDetails {
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    if (clampedScore >= TRUST_TIERS.PLATINUM.minScore) {
      return {
        score: clampedScore,
        tier: 'PLATINUM',
        maxEscrowAmount: TRUST_TIERS.PLATINUM.maxEscrow,
        nextTier: null,
        pointsToNextTier: 0,
      };
    }

    if (clampedScore >= TRUST_TIERS.GOLD.minScore) {
      return {
        score: clampedScore,
        tier: 'GOLD',
        maxEscrowAmount: TRUST_TIERS.GOLD.maxEscrow,
        nextTier: 'PLATINUM',
        pointsToNextTier: TRUST_TIERS.PLATINUM.minScore - clampedScore,
      };
    }

    if (clampedScore >= TRUST_TIERS.SILVER.minScore) {
      return {
        score: clampedScore,
        tier: 'SILVER',
        maxEscrowAmount: TRUST_TIERS.SILVER.maxEscrow,
        nextTier: 'GOLD',
        pointsToNextTier: TRUST_TIERS.GOLD.minScore - clampedScore,
      };
    }

    if (clampedScore >= TRUST_TIERS.BRONZE.minScore) {
      return {
        score: clampedScore,
        tier: 'BRONZE',
        maxEscrowAmount: TRUST_TIERS.BRONZE.maxEscrow,
        nextTier: 'SILVER',
        pointsToNextTier: TRUST_TIERS.SILVER.minScore - clampedScore,
      };
    }

    return {
      score: clampedScore,
      tier: 'STARTER',
      maxEscrowAmount: TRUST_TIERS.STARTER.maxEscrow,
      nextTier: 'BRONZE',
      pointsToNextTier: TRUST_TIERS.BRONZE.minScore - clampedScore,
    };
  }

  /**
   * Applies an adjustment to current score and clamps between 0 and 100.
   *
   * @param currentScore - Current score
   * @param adjustmentType - Reason enum from TRUST_SCORE_ADJUSTMENTS
   */
  static calculateNewScore(
    currentScore: number,
    adjustmentType: keyof typeof TRUST_SCORE_ADJUSTMENTS,
  ): number {
    const delta = TRUST_SCORE_ADJUSTMENTS[adjustmentType];
    return Math.max(0, Math.min(100, Math.round(currentScore + delta)));
  }

  /**
   * Checks if an escrow transaction amount is permissible under the user's trust tier.
   *
   * @param score - User's trust score
   * @param amount - Escrow transaction amount in paise
   */
  static isEscrowPermitted(score: number, amount: number): boolean {
    const details = this.getDetails(score);
    return amount <= details.maxEscrowAmount;
  }
}
