import type { SupabaseClient } from '@supabase/supabase-js';
import type { IEscrowRepository } from '../../application/interfaces/IEscrowRepository.js';
import { EscrowTransaction } from '../../domain/entities/EscrowTransaction.js';
import { ConcurrencyError, DatabaseError } from '../../shared/errors/index.js';
import type { EscrowStatusType, EscrowTypeValue } from '../../domain/enums/index.js';

interface EscrowRow {
  id: string;
  type: EscrowTypeValue;
  buyer_id: string;
  seller_id: string;
  amount: number | string;
  platform_fee: number | string;
  status: EscrowStatusType;
  inspection_deadline: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IEscrowRepository.
 * Manages EscrowTransaction persistence with strict optimistic locking.
 */
export class SupabaseEscrowRepository implements IEscrowRepository {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Finds an escrow transaction by UUID.
   */
  async findById(id: string): Promise<EscrowTransaction | null> {
    const { data, error } = await this.client
      .from('escrow_transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle<EscrowRow>();

    if (error) {
      throw new DatabaseError('findById escrow', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Finds escrow transactions where user is the buyer.
   */
  async findByBuyerId(
    buyerId: string,
    status?: EscrowStatusType,
  ): Promise<EscrowTransaction[]> {
    let query = this.client
      .from('escrow_transactions')
      .select('*')
      .eq('buyer_id', buyerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('findByBuyerId escrow', error.message);
    }

    if (!data) return [];
    return data.map((row: EscrowRow) => this.toDomain(row));
  }

  /**
   * Finds escrow transactions where user is the seller.
   */
  async findBySellerId(
    sellerId: string,
    status?: EscrowStatusType,
  ): Promise<EscrowTransaction[]> {
    let query = this.client
      .from('escrow_transactions')
      .select('*')
      .eq('seller_id', sellerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('findBySellerId escrow', error.message);
    }

    if (!data) return [];
    return data.map((row: EscrowRow) => this.toDomain(row));
  }

  /**
   * Inserts a new escrow transaction.
   */
  async create(escrow: EscrowTransaction): Promise<void> {
    const payload = escrow.toPersistence();
    const { error } = await this.client.from('escrow_transactions').insert(payload);

    if (error) {
      throw new DatabaseError('create escrow', error.message);
    }
  }

  /**
   * Saves updates with optimistic locking.
   * Compares the version in the database against (escrow.version - 1).
   */
  async save(escrow: EscrowTransaction): Promise<void> {
    const payload = escrow.toPersistence();
    const expectedDbVersion = escrow.version - 1;

    const { data, error } = await this.client
      .from('escrow_transactions')
      .update(payload)
      .eq('id', escrow.id)
      .eq('version', expectedDbVersion)
      .select('id');

    if (error) {
      throw new DatabaseError('save escrow', error.message);
    }

    if (!data || data.length === 0) {
      throw new ConcurrencyError(
        `EscrowTransaction '${escrow.id}' version conflict. Expected version ${expectedDbVersion}.`,
      );
    }
  }

  private toDomain(row: EscrowRow): EscrowTransaction {
    return EscrowTransaction.fromPersistence({
      id: row.id,
      type: row.type,
      buyer_id: row.buyer_id,
      seller_id: row.seller_id,
      amount: Number(row.amount),
      platform_fee: Number(row.platform_fee),
      status: row.status,
      inspection_deadline: row.inspection_deadline,
      version: row.version,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
