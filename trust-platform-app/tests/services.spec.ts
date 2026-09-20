import { describe, it, expect } from 'vitest';
import { freelanceService } from '../src/services/freelanceService';
import { gamingService } from '../src/services/gamingService';
import { homeService } from '../src/services/homeService';

describe('Parts 3.3, 3.5, 3.6 — Domain Services & AI Integrations', () => {
  it('should fetch freelance projects with milestones and quality gate metrics', async () => {
    const projects = await freelanceService.getProjects();
    expect(projects.length).toBeGreaterThan(0);
    const proj = projects[0];
    expect(proj.milestones.length).toBeGreaterThan(0);

    const reviewMilestone = proj.milestones.find((m) => m.status === 'CLIENT_REVIEW');
    expect(reviewMilestone).toBeDefined();
    expect(reviewMilestone?.qualityGate?.overallPassed).toBe(true);
    expect(reviewMilestone?.qualityGate?.testCoveragePercent).toBeGreaterThanOrEqual(80);
  });

  it('should submit freelance deliverable and receive AI quality gate result', async () => {
    const result = await freelanceService.submitDeliverable(
      'ms_test_1',
      'https://github.com/trust-platform/pr/1',
      'Completed implementation'
    );
    expect(result.linterPassed).toBe(true);
    expect(result.testCoveragePercent).toBe(94.2);
    expect(result.criticalVulnerabilities).toBe(0);
    expect(result.ghostingRiskScore).toBeLessThan(30);
  });

  it('should create and accept gaming challenge wagers', async () => {
    const chal = await gamingService.createChallenge({
      game: 'BGMI',
      stakeAmount: 2000,
      rules: 'Warehouse 1v1 M416 only',
    });
    expect(chal.stakeAmount).toBe(2000);
    expect(chal.prizePool).toBe(Math.round(2000 * 2 * 0.99));

    const accepted = await gamingService.acceptChallenge(chal.id);
    expect(accepted.status).toBe('MATCHED');
    expect(accepted.roomCode).toBeDefined();
  });

  it('should report match result and perform CV verification analysis', async () => {
    const verification = await gamingService.reportResult(
      'chal_test_99',
      true,
      'https://trustvault.io/screenshot.png'
    );
    expect(verification.cvConfidenceScore).toBeGreaterThan(90);
    expect(verification.antiTamperPassed).toBe(true);
    expect(verification.status).toBe('AUTO_CONFIRMED');
  });

  it('should retrieve trust score dynamic breakdown and factors', async () => {
    const breakdown = await homeService.getTrustScoreBreakdown();
    expect(breakdown.currentScore).toBe(845);
    expect(breakdown.tier).toBe('GOLD');
    expect(breakdown.factors.length).toBeGreaterThanOrEqual(4);
  });
});
