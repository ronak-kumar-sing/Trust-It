import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IGamingChallengeRepository,
  ChallengeFilter,
} from '../../application/interfaces/IGamingChallengeRepository.js';
import { GamingChallenge } from '../../domain/entities/GamingChallenge.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type { ChallengeStatusType } from '../../domain/enums/ChallengeStatus.js';

interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  game_title: string;
  stake_amount: number | string;
  rules: Record<string, unknown>;
  status: ChallengeStatusType;
  escrow_transaction_id: string | null;
  response_deadline: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IGamingChallengeRepository.
 */
export class SupabaseGamingChallengeRepository
  implements IGamingChallengeRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<GamingChallenge | null> {
    const { data, error } = await this.client
      .from('gaming_challenges')
      .select('*')
      .eq('id', id)
      .maybeSingle<ChallengeRow>();

    if (error) {
      throw new DatabaseError('findById gaming_challenges', error.message);
    }
    if (!data) return null;
    return this.toDomain(data);
  }

  async findOpenChallenges(filter?: ChallengeFilter): Promise<GamingChallenge[]> {
    const limit = filter?.limit ?? 50;
    const offset = filter?.offset ?? 0;

    const { data, error } = await this.client
      .from('gaming_challenges')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError('findOpenChallenges', error.message);
    }
    if (!data) return [];
    return data.map((row: ChallengeRow) => this.toDomain(row));
  }

  async findByUserId(userId: string): Promise<GamingChallenge[]> {
    const { data, error } = await this.client
      .from('gaming_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('findByUserId gaming_challenges', error.message);
    }
    if (!data) return [];
    return data.map((row: ChallengeRow) => this.toDomain(row));
  }

  async create(challenge: GamingChallenge): Promise<void> {
    const payload = challenge.toPersistence();
    const { error } = await this.client.from('gaming_challenges').insert(payload);
    if (error) {
      throw new DatabaseError('create gaming_challenge', error.message);
    }
  }

  async update(challenge: GamingChallenge): Promise<void> {
    const payload = challenge.toPersistence();
    const { error } = await this.client
      .from('gaming_challenges')
      .update(payload)
      .eq('id', challenge.id);
    if (error) {
      throw new DatabaseError('update gaming_challenge', error.message);
    }
  }

  private toDomain(row: ChallengeRow): GamingChallenge {
    return GamingChallenge.fromPersistence({
      id: row.id,
      challenger_id: row.challenger_id,
      opponent_id: row.opponent_id,
      game_title: row.game_title,
      stake_amount: row.stake_amount,
      rules: row.rules,
      status: row.status,
      escrow_transaction_id: row.escrow_transaction_id,
      response_deadline: row.response_deadline,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
