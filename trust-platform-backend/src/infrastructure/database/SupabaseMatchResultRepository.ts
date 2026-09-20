import type { SupabaseClient } from '@supabase/supabase-js';
import type { IMatchResultRepository } from '../../application/interfaces/IMatchResultRepository.js';
import { MatchResult } from '../../domain/entities/MatchResult.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type { VerificationStatusType } from '../../domain/enums/ChallengeStatus.js';

interface MatchResultRow {
  id: string;
  challenge_id: string;
  reporter_id: string;
  claimed_winner_id: string;
  evidence_url: string | null;
  verification_status: VerificationStatusType;
  ai_confidence: number | null;
  created_at: string;
}

/**
 * Supabase implementation of IMatchResultRepository.
 */
export class SupabaseMatchResultRepository implements IMatchResultRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<MatchResult | null> {
    const { data, error } = await this.client
      .from('match_results')
      .select('*')
      .eq('id', id)
      .maybeSingle<MatchResultRow>();

    if (error) {
      throw new DatabaseError('findById match_results', error.message);
    }
    if (!data) return null;
    return this.toDomain(data);
  }

  async findByChallengeId(challengeId: string): Promise<MatchResult[]> {
    const { data, error } = await this.client
      .from('match_results')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new DatabaseError('findByChallengeId match_results', error.message);
    }
    if (!data) return [];
    return data.map((row: MatchResultRow) => this.toDomain(row));
  }

  async create(matchResult: MatchResult): Promise<void> {
    const payload = matchResult.toPersistence();
    const { error } = await this.client.from('match_results').insert(payload);
    if (error) {
      throw new DatabaseError('create match_result', error.message);
    }
  }

  async update(matchResult: MatchResult): Promise<void> {
    const payload = matchResult.toPersistence();
    const { error } = await this.client
      .from('match_results')
      .update(payload)
      .eq('id', matchResult.id);
    if (error) {
      throw new DatabaseError('update match_result', error.message);
    }
  }

  private toDomain(row: MatchResultRow): MatchResult {
    return MatchResult.fromPersistence({
      id: row.id,
      challenge_id: row.challenge_id,
      reporter_id: row.reporter_id,
      claimed_winner_id: row.claimed_winner_id,
      evidence_url: row.evidence_url,
      verification_status: row.verification_status,
      ai_confidence: row.ai_confidence,
      created_at: row.created_at,
    });
  }
}
