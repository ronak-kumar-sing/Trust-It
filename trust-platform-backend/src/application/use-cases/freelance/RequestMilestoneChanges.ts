import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { RequestChangesDTO, MilestoneDTO } from '../../dtos/freelance.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Client requests revisions on milestone deliverable.
 * Enforces a strict limit of MAX_REVISION_ROUNDS (3 rounds).
 */
export class RequestMilestoneChanges {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: RequestChangesDTO): Promise<MilestoneDTO> {
    if (!dto.feedback?.trim()) {
      throw new ValidationError('Feedback must be provided when requesting changes');
    }

    const milestone = await this.milestoneRepository.findById(dto.milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', dto.milestoneId);
    }

    const project = await this.projectRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundError('Project', milestone.projectId);
    }

    if (project.clientId !== dto.clientId) {
      throw new ForbiddenError('Only the project client can request changes');
    }

    // milestone.requestChanges() enforces MAX_REVISION_ROUNDS (3)
    milestone.requestChanges();

    await this.milestoneRepository.update(milestone);

    await this.auditLogger.log({
      entity: 'milestone',
      entityId: milestone.id,
      action: 'CHANGES_REQUESTED',
      actorId: dto.clientId,
      metadata: {
        revisionCount: milestone.revisionCount,
        feedback: dto.feedback,
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
