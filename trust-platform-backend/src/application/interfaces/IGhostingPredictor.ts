export type GhostingRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GhostingRecommendedAction =
  | 'NONE'
  | 'PING_REMINDER'
  | 'EARLY_WARNING'
  | 'AUTO_ESCALATE';

export interface GhostingAssessmentParams {
  userId: string;
  lastActivityAt: Date;
  pendingMilestoneCount?: number;
  trustScore?: number;
  daysUntilDeadline?: number;
}

export interface GhostingAssessmentResult {
  riskScore: number; // 0 to 100
  riskLevel: GhostingRiskLevel;
  daysSinceLastActivity: number;
  recommendedAction: GhostingRecommendedAction;
  reasons: string[];
}

/**
 * Port Contract: AI Ghosting & Abandonment Predictor.
 */
export interface IGhostingPredictor {
  /**
   * Evaluates counterparty behavior patterns and forecasts abandonment probability.
   */
  assessRisk(params: GhostingAssessmentParams): Promise<GhostingAssessmentResult>;
}
