import { describe, it, expect } from 'vitest';
import { TrustScoreCalculator } from '../../../src/domain/services/TrustScoreCalculator.js';
import { TRUST_TIERS } from '../../../src/shared/constants/index.js';

describe('TrustScoreCalculator (Domain Service)', () => {
  describe('getDetails()', () => {
    it('returns STARTER tier for score between 0 and 29', () => {
      const detailsZero = TrustScoreCalculator.getDetails(0);
      expect(detailsZero.tier).toBe('STARTER');
      expect(detailsZero.maxEscrowAmount).toBe(TRUST_TIERS.STARTER.maxEscrow);
      expect(detailsZero.nextTier).toBe('BRONZE');
      expect(detailsZero.pointsToNextTier).toBe(30);

      const details29 = TrustScoreCalculator.getDetails(29);
      expect(details29.tier).toBe('STARTER');
      expect(details29.pointsToNextTier).toBe(1);
    });

    it('returns BRONZE tier for score between 30 and 59', () => {
      const details30 = TrustScoreCalculator.getDetails(30);
      expect(details30.tier).toBe('BRONZE');
      expect(details30.maxEscrowAmount).toBe(TRUST_TIERS.BRONZE.maxEscrow);
      expect(details30.nextTier).toBe('SILVER');
      expect(details30.pointsToNextTier).toBe(30);

      const details59 = TrustScoreCalculator.getDetails(59);
      expect(details59.tier).toBe('BRONZE');
      expect(details59.pointsToNextTier).toBe(1);
    });

    it('returns SILVER tier for score between 60 and 79', () => {
      const details60 = TrustScoreCalculator.getDetails(60);
      expect(details60.tier).toBe('SILVER');
      expect(details60.maxEscrowAmount).toBe(TRUST_TIERS.SILVER.maxEscrow);
      expect(details60.nextTier).toBe('GOLD');
      expect(details60.pointsToNextTier).toBe(20);

      const details79 = TrustScoreCalculator.getDetails(79);
      expect(details79.tier).toBe('SILVER');
      expect(details79.pointsToNextTier).toBe(1);
    });

    it('returns GOLD tier for score between 80 and 94', () => {
      const details80 = TrustScoreCalculator.getDetails(80);
      expect(details80.tier).toBe('GOLD');
      expect(details80.maxEscrowAmount).toBe(TRUST_TIERS.GOLD.maxEscrow);
      expect(details80.nextTier).toBe('PLATINUM');
      expect(details80.pointsToNextTier).toBe(15);

      const details94 = TrustScoreCalculator.getDetails(94);
      expect(details94.tier).toBe('GOLD');
      expect(details94.pointsToNextTier).toBe(1);
    });

    it('returns PLATINUM tier for score 95 to 100', () => {
      const details95 = TrustScoreCalculator.getDetails(95);
      expect(details95.tier).toBe('PLATINUM');
      expect(details95.maxEscrowAmount).toBe(TRUST_TIERS.PLATINUM.maxEscrow);
      expect(details95.nextTier).toBeNull();
      expect(details95.pointsToNextTier).toBe(0);

      const details100 = TrustScoreCalculator.getDetails(100);
      expect(details100.tier).toBe('PLATINUM');
      expect(details100.nextTier).toBeNull();
    });

    it('clamps negative scores to 0 and excessive scores to 100', () => {
      const detailsNeg = TrustScoreCalculator.getDetails(-15);
      expect(detailsNeg.score).toBe(0);
      expect(detailsNeg.tier).toBe('STARTER');

      const detailsOver = TrustScoreCalculator.getDetails(150);
      expect(detailsOver.score).toBe(100);
      expect(detailsOver.tier).toBe('PLATINUM');
    });
  });

  describe('calculateNewScore()', () => {
    it('applies COMPLETED_ESCROW bonus (+5)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'COMPLETED_ESCROW')).toBe(55);
    });

    it('applies KYC_VERIFIED bonus (+15)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'KYC_VERIFIED')).toBe(65);
    });

    it('applies DISPUTE_WON bonus (+2)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'DISPUTE_WON')).toBe(52);
    });

    it('applies DISPUTE_LOST_MINOR penalty (-5)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'DISPUTE_LOST_MINOR')).toBe(45);
    });

    it('applies DISPUTE_LOST_MAJOR penalty (-15)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'DISPUTE_LOST_MAJOR')).toBe(35);
    });

    it('applies DISPUTE_FRAUDULENT penalty (-30)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'DISPUTE_FRAUDULENT')).toBe(20);
    });

    it('applies INACTIVITY_DECAY penalty (-2)', () => {
      expect(TrustScoreCalculator.calculateNewScore(50, 'INACTIVITY_DECAY')).toBe(48);
    });

    it('clamps to 0 when penalty exceeds score', () => {
      expect(TrustScoreCalculator.calculateNewScore(10, 'DISPUTE_FRAUDULENT')).toBe(0);
    });

    it('clamps to 100 when bonus exceeds 100', () => {
      expect(TrustScoreCalculator.calculateNewScore(95, 'KYC_VERIFIED')).toBe(100);
    });
  });

  describe('isEscrowPermitted()', () => {
    it('permits amount within tier limit', () => {
      // Starter tier limit is 500,000 paise (₹5,000)
      expect(TrustScoreCalculator.isEscrowPermitted(20, 500000)).toBe(true);
      expect(TrustScoreCalculator.isEscrowPermitted(20, 250000)).toBe(true);
    });

    it('rejects amount exceeding tier limit', () => {
      // Starter tier limit is 500,000 paise (₹5,000)
      expect(TrustScoreCalculator.isEscrowPermitted(20, 500001)).toBe(false);
      expect(TrustScoreCalculator.isEscrowPermitted(20, 1000000)).toBe(false);
    });

    it('allows higher amounts for higher tiers', () => {
      // Bronze (30-59) limit is 2,500,000 paise (₹25,000)
      expect(TrustScoreCalculator.isEscrowPermitted(40, 2500000)).toBe(true);
      expect(TrustScoreCalculator.isEscrowPermitted(40, 2500001)).toBe(false);

      // Platinum (95+) limit is 100,000,000 paise (₹10,00,000)
      expect(TrustScoreCalculator.isEscrowPermitted(95, 100000000)).toBe(true);
    });
  });
});
