import { Project } from '../../../domain/entities/Project.js';
import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { CreateProjectDTO, ProjectDTO } from '../../dtos/freelance.dto.js';

/**
 * Use case: Create a new freelance project contract.
 */
export class CreateProject {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: CreateProjectDTO): Promise<ProjectDTO> {
    const project = Project.create({
      clientId: dto.clientId,
      freelancerId: dto.freelancerId,
      title: dto.title,
      description: dto.description,
      totalBudget: dto.totalBudget,
    });

    await this.projectRepository.create(project);

    await this.auditLogger.log({
      entity: 'project',
      entityId: project.id,
      action: 'PROJECT_CREATED',
      actorId: dto.clientId,
      metadata: {
        freelancerId: dto.freelancerId,
        totalBudget: dto.totalBudget,
      },
    });

    return {
      id: project.id,
      clientId: project.clientId,
      freelancerId: project.freelancerId,
      title: project.title,
      description: project.description,
      totalBudget: project.totalBudget,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
