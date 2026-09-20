import type { Project } from '../../domain/entities/Project.js';

/**
 * Port interface for Project persistence.
 */
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByClientId(clientId: string): Promise<Project[]>;
  findByFreelancerId(freelancerId: string): Promise<Project[]>;
  create(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
}
