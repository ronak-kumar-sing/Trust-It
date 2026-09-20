import { describe, it, expect } from 'vitest';
import { GhostingPredictorStub } from '../../../../src/infrastructure/ai/GhostingPredictorStub.js';

describe('GhostingPredictorStub', () => {
  const predictor = new GhostingPredictorStub();

  it('predicts LOW risk when user was active within last few hours', async () => {
    const result = await predictor.assessRisk({
      userId: 'usr_active',
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
      trustScore: 70,
    });

    expect(result.riskLevel).toBe('LOW');
    expect(result.recommendedAction).toBe('NONE');
    expect(result.daysSinceLastActivity).toBeLessThan(1);
    expect(result.riskScore).toBeLessThan(25);
  });

  it('predicts MEDIUM risk when user is inactive for 2 days', async () => {
    const result = await predictor.assessRisk({
      userId: 'usr_slow',
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 2.5), // 2.5 days
      trustScore: 50,
    });

    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.recommendedAction).toBe('PING_REMINDER');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('predicts HIGH or CRITICAL risk when inactive 5+ days with imminent deadline', async () => {
    const result = await predictor.assessRisk({
      userId: 'usr_ghost',
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 6), // 6 days ago
      daysUntilDeadline: 1, // Deadline in 24 hours
      pendingMilestoneCount: 2,
      trustScore: 40,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(50);
    expect(['HIGH', 'CRITICAL']).toContain(result.riskLevel);
    expect(['EARLY_WARNING', 'AUTO_ESCALATE']).toContain(result.recommendedAction);
    expect(result.reasons).toContain('Deadline is within 48 hours while counterparty remains inactive');
  });

  it('mitigates risk score when trust score is very high', async () => {
    const normalUser = await predictor.assessRisk({
      userId: 'usr_mid',
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 5.5),
      trustScore: 50,
    });

    const highTrustUser = await predictor.assessRisk({
      userId: 'usr_high_trust',
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 5.5),
      trustScore: 90,
    });

    expect(highTrustUser.riskScore).toBeLessThan(normalUser.riskScore);
  });
});
