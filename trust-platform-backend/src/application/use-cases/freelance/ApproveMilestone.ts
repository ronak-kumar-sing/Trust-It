import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { TransitionEscrowState } from '../escrow/TransitionEscrowState.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { MilestoneDTO } from '../../dtos/freelance.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Client approves milestone deliverable.
 * Transitions milestone to APPROVED & RELEASED, releases escrowed funds to freelancer (minus 5% fee),
 * and marks the project as COMPLETED if all milestones are finalized.
 */
export class ApproveMilestone {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
    private readonly transitionEscrowState: TransitionEscrowState,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(milestoneId: string, clientId: string): Promise<MilestoneDTO> {
    const milestone = await this.milestoneRepository.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId);
    }

    const project = await this.projectRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundError('Project', milestone.projectId);
    }

    if (project.clientId !== clientId) {
      throw new ForbiddenError('Only the project client can approve this milestone');
    }

    if (!milestone.escrowTransactionId) {
      throw new ValidationError(
        'Milestone does not have an active escrow transaction',
      );
    }

    // 1. Advance milestone domain state: UNDER_REVIEW -> APPROVED -> RELEASED
    milestone.approve();
    milestone.release();

    // 2. Release Escrow funds to freelancer wallet minus 5% platform fee
    await this.transitionEscrowState.execute({
      escrowTransactionId: milestone.escrowTransactionId,
      targetState: 'RELEASED',
      actorId: clientId,
    });

    await this.milestoneRepository.update(milestone);

    // 3. If all milestones in project are completed, complete the project
    const allMilestones = await this.milestoneRepository.findByProjectId(
      project.id,
    );
    const allCompleted = allMilestones.every(
      (m) => m.id === milestone.id || m.status === 'RELEASED',
    );
    if (allCompleted && allMilestones.length > 0) {
      project.complete();
      await this.projectRepository.update(project);
    }

    await this.auditLogger.log({
      entity: 'milestone',
      entityId: milestone.id,
      action: 'MILESTONE_APPROVED',
      actorId: clientId,
      metadata: {
        escrowTransactionId: milestone.escrowTransactionId,
        projectCompleted: allCompleted,
      },
    });

    return {
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      sowText: milestone.sowText,
      status: milestone.status,
      qualityGateResult: milestone.qualityGateResult,
      submissionUrl: milestone.submissionUrl,
      revisionCount: milestone.revisionCount,
      escrowTransactionId: milestone.escrowTransactionId,
      reviewDeadline: milestone.reviewDeadline?.toISOString() ?? null,
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }
}
