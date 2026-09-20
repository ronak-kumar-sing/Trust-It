import { Milestone } from '../../../domain/entities/Milestone.js';
import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { CreateMilestoneDTO, MilestoneDTO } from '../../dtos/freelance.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Create a new milestone under a freelance project.
 */
export class CreateMilestone {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: CreateMilestoneDTO): Promise<MilestoneDTO> {
    const project = await this.projectRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundError('Project', dto.projectId);
    }

    if (project.clientId !== dto.clientId) {
      throw new ForbiddenError('Only the project client can create milestones');
    }

    if (project.status !== 'ACTIVE') {
      throw new ConflictError(
        `Cannot add milestone to project with status ${project.status}`,
      );
    }

    const milestone = Milestone.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      sowText: dto.sowText,
    });

    await this.milestoneRepository.create(milestone);

    await this.auditLogger.log({
      entity: 'milestone',
      entityId: milestone.id,
      action: 'MILESTONE_CREATED',
      actorId: dto.clientId,
      metadata: {
        projectId: project.id,
        amount: dto.amount,
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
