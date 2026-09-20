import type { SupabaseClient } from '@supabase/supabase-js';
import type { IProjectRepository } from '../../application/interfaces/IProjectRepository.js';
import { Project } from '../../domain/entities/Project.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type { ProjectStatusType } from '../../domain/enums/ProjectStatus.js';

interface ProjectRow {
  id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  total_budget: number | string;
  status: ProjectStatusType;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IProjectRepository.
 */
export class SupabaseProjectRepository implements IProjectRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle<ProjectRow>();

    if (error) {
      throw new DatabaseError('findById project', error.message);
    }
    if (!data) return null;
    return Project.fromPersistence(data);
  }

  async findByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('findByClientId project', error.message);
    }
    if (!data) return [];
    return data.map((row: ProjectRow) => Project.fromPersistence(row));
  }

  async findByFreelancerId(freelancerId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('findByFreelancerId project', error.message);
    }
    if (!data) return [];
    return data.map((row: ProjectRow) => Project.fromPersistence(row));
  }

  async create(project: Project): Promise<void> {
    const payload = project.toPersistence();
    const { error } = await this.client.from('projects').insert(payload);
    if (error) {
      throw new DatabaseError('create project', error.message);
    }
  }

  async update(project: Project): Promise<void> {
    const payload = project.toPersistence();
    const { error } = await this.client
      .from('projects')
      .update(payload)
      .eq('id', project.id);
    if (error) {
      throw new DatabaseError('update project', error.message);
    }
  }
}
