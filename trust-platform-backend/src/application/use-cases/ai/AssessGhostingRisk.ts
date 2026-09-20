import type {
  IGhostingPredictor,
  GhostingAssessmentResult,
} from '../../interfaces/IGhostingPredictor.js';
import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { SendNotification } from '../notification/SendNotification.js';
import { NotificationType } from '../../../domain/enums/NotificationType.js';

export interface AssessGhostingRiskDTO {
  userId: string;
  lastActivityAt: Date;
  pendingMilestoneCount?: number;
  daysUntilDeadline?: number;
  actorId?: string;
}

/**
 * Use case: AI-driven ghosting and counterparty abandonment risk assessment.
 */
export class AssessGhostingRisk {
  constructor(
    private readonly ghostingPredictor: IGhostingPredictor,
    private readonly auditLogger: IAuditLogger,
    private readonly userRepository?: IUserRepository,
    private readonly sendNotification?: SendNotification,
  ) {}

  async execute(dto: AssessGhostingRiskDTO): Promise<GhostingAssessmentResult> {
    let trustScore = 50;

    if (this.userRepository) {
      const user = await this.userRepository.findById(dto.userId);
      if (user) {
        trustScore = user.trustScore;
      }
    }

    const result = await this.ghostingPredictor.assessRisk({
      userId: dto.userId,
      lastActivityAt: dto.lastActivityAt,
      pendingMilestoneCount: dto.pendingMilestoneCount,
      trustScore,
      daysUntilDeadline: dto.daysUntilDeadline,
    });

    if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
      await this.auditLogger.log({
        entity: 'user_inactivity_risk',
        entityId: dto.userId,
        action: 'HIGH_GHOSTING_RISK_DETECTED',
        actorId: dto.actorId ?? 'AI_GHOSTING_SENTINEL',
        metadata: {
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          daysSinceLastActivity: result.daysSinceLastActivity,
          recommendedAction: result.recommendedAction,
          reasons: result.reasons,
        },
      });

      if (this.sendNotification) {
        await this.sendNotification.execute({
          userId: dto.userId,
          type: NotificationType.REVIEW_EXPIRING,
          title: 'Action Required: Pending Platform Activity',
          body: `Notice: You have pending milestones or escrow activity with an approaching deadline. Please check in to prevent automated penalties.`,
          data: {
            riskLevel: result.riskLevel,
            recommendedAction: result.recommendedAction,
          },
        });
      }
    }

    return result;
  }
}
