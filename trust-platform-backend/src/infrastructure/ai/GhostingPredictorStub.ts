import type {
  IGhostingPredictor,
  GhostingAssessmentParams,
  GhostingAssessmentResult,
  GhostingRiskLevel,
  GhostingRecommendedAction,
} from '../../application/interfaces/IGhostingPredictor.js';

/**
 * Stub implementation of AI Inactivity & Ghosting Predictor.
 * Scores risk based on response lag, upcoming deadlines, pending milestones, and trust tier.
 */
export class GhostingPredictorStub implements IGhostingPredictor {
  async assessRisk(
    params: GhostingAssessmentParams,
  ): Promise<GhostingAssessmentResult> {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - params.lastActivityAt.getTime());
    const daysSinceLastActivity = Number((elapsedMs / (1000 * 60 * 60 * 24)).toFixed(1));

    let riskScore = 0;
    const reasons: string[] = [];

    // Inactivity duration scoring
    if (daysSinceLastActivity >= 10) {
      riskScore += 65;
      reasons.push(`High inactivity: No response in ${daysSinceLastActivity} days`);
    } else if (daysSinceLastActivity >= 5) {
      riskScore += 40;
      reasons.push(`Moderate inactivity: No response in ${daysSinceLastActivity} days`);
    } else if (daysSinceLastActivity >= 2) {
      riskScore += 25;
      reasons.push(`Minor delay: No response in ${daysSinceLastActivity} days`);
    } else {
      reasons.push('Recent activity detected within normal operating parameters');
    }

    // Deadline urgency multiplier
    if (
      params.daysUntilDeadline !== undefined &&
      params.daysUntilDeadline <= 2 &&
      daysSinceLastActivity >= 2
    ) {
      riskScore += 25;
      reasons.push('Deadline is within 48 hours while counterparty remains inactive');
    }

    // Pending milestones weight
    if ((params.pendingMilestoneCount ?? 0) > 1 && daysSinceLastActivity >= 3) {
      riskScore += 15;
      reasons.push('Multiple active milestones blocked by lack of communication');
    }

    // Trust Score mitigation (high score user gets benefit of the doubt)
    const trustScore = params.trustScore ?? 50;
    if (trustScore >= 80) {
      riskScore = Math.max(0, riskScore - 15);
      reasons.push('Strong platform trust reputation mitigates baseline risk');
    } else if (trustScore < 30) {
      riskScore = Math.min(100, riskScore + 15);
      reasons.push('Low historical trust score amplifies abandonment likelihood');
    }

    riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

    let riskLevel: GhostingRiskLevel = 'LOW';
    let recommendedAction: GhostingRecommendedAction = 'NONE';

    if (riskScore >= 75) {
      riskLevel = 'CRITICAL';
      recommendedAction = 'AUTO_ESCALATE';
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
      recommendedAction = 'EARLY_WARNING';
    } else if (riskScore >= 25) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'PING_REMINDER';
    }

    return {
      riskScore,
      riskLevel,
      daysSinceLastActivity,
      recommendedAction,
      reasons,
    };
  }
}
