import type { Milestone } from '../../domain/entities/Milestone.js';

/**
 * Port interface for Milestone persistence.
 */
export interface IMilestoneRepository {
  findById(id: string): Promise<Milestone | null>;
  findByProjectId(projectId: string): Promise<Milestone[]>;
  create(milestone: Milestone): Promise<void>;
  update(milestone: Milestone): Promise<void>;
}
