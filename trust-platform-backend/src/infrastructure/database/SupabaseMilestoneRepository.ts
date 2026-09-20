import type { SupabaseClient } from '@supabase/supabase-js';
import type { IMilestoneRepository } from '../../application/interfaces/IMilestoneRepository.js';
import { Milestone } from '../../domain/entities/Milestone.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type { MilestoneStatusType } from '../../domain/enums/ProjectStatus.js';

interface MilestoneRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number | string;
  sow_text: string;
  status: MilestoneStatusType;
  quality_gate_result: Record<string, unknown> | null;
  submission_url: string | null;
  revision_count: number;
  escrow_transaction_id: string | null;
  review_deadline: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IMilestoneRepository.
 */
export class SupabaseMilestoneRepository implements IMilestoneRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Milestone | null> {
    const { data, error } = await this.client
      .from('milestones')
      .select('*')
      .eq('id', id)
      .maybeSingle<MilestoneRow>();

    if (error) {
      throw new DatabaseError('findById milestone', error.message);
    }
    if (!data) return null;
    return this.toDomain(data);
  }

  async findByProjectId(projectId: string): Promise<Milestone[]> {
    const { data, error } = await this.client
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new DatabaseError('findByProjectId milestone', error.message);
    }
    if (!data) return [];
    return data.map((row: MilestoneRow) => this.toDomain(row));
  }

  async create(milestone: Milestone): Promise<void> {
    const payload = milestone.toPersistence();
    const { error } = await this.client.from('milestones').insert(payload);
    if (error) {
      throw new DatabaseError('create milestone', error.message);
    }
  }

  async update(milestone: Milestone): Promise<void> {
    const payload = milestone.toPersistence();
    const { error } = await this.client
      .from('milestones')
      .update(payload)
      .eq('id', milestone.id);
    if (error) {
      throw new DatabaseError('update milestone', error.message);
    }
  }

  private toDomain(row: MilestoneRow): Milestone {
    return Milestone.fromPersistence({
      id: row.id,
      project_id: row.project_id,
      title: row.title,
      description: row.description,
      amount: Number(row.amount),
      sow_text: row.sow_text,
      status: row.status,
      quality_gate_result: row.quality_gate_result,
      submission_url: row.submission_url,
      revision_count: row.revision_count,
      escrow_transaction_id: row.escrow_transaction_id,
      review_deadline: row.review_deadline,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
