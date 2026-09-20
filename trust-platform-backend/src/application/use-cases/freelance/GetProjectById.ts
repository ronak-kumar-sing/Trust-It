import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { ProjectDTO } from '../../dtos/freelance.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve a freelance project along with its milestones.
 */
export class GetProjectById {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
  ) {}

  async execute(projectId: string): Promise<ProjectDTO> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const milestones = await this.milestoneRepository.findByProjectId(projectId);

    return {
      id: project.id,
      clientId: project.clientId,
      freelancerId: project.freelancerId,
      title: project.title,
      description: project.description,
      totalBudget: project.totalBudget,
      status: project.status,
      milestones: milestones.map((m) => ({
        id: m.id,
        projectId: m.projectId,
        title: m.title,
        description: m.description,
        amount: m.amount,
        sowText: m.sowText,
        status: m.status,
        qualityGateResult: m.qualityGateResult,
        submissionUrl: m.submissionUrl,
        revisionCount: m.revisionCount,
        escrowTransactionId: m.escrowTransactionId,
        reviewDeadline: m.reviewDeadline?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
