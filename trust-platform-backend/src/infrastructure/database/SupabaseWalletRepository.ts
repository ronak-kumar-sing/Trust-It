import type { SupabaseClient } from '@supabase/supabase-js';
import type { IWalletRepository } from '../../application/interfaces/IWalletRepository.js';
import { Wallet } from '../../domain/entities/Wallet.js';
import { ConcurrencyError, DatabaseError } from '../../shared/errors/index.js';

interface WalletRow {
  id: string;
  user_id: string;
  available_balance: number | string;
  frozen_balance: number | string;
  total_earned: number | string;
  total_spent: number | string;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IWalletRepository.
 * Enforces optimistic locking on save operations.
 */
export class SupabaseWalletRepository implements IWalletRepository {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Finds a wallet by its UUID.
   *
   * @param id - Wallet UUID
   * @returns Wallet entity or null if not found
   */
  async findById(id: string): Promise<Wallet | null> {
    const { data, error } = await this.client
      .from('wallets')
      .select('*')
      .eq('id', id)
      .maybeSingle<WalletRow>();

    if (error) {
      throw new DatabaseError('findById wallet', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Finds a wallet by owning user's UUID.
   *
   * @param userId - User UUID
   * @returns Wallet entity or null if not found
   */
  async findByUserId(userId: string): Promise<Wallet | null> {
    const { data, error } = await this.client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<WalletRow>();

    if (error) {
      throw new DatabaseError('findByUserId wallet', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Persists a new wallet in the database.
   *
   * @param wallet - Wallet entity to create
   */
  async create(wallet: Wallet): Promise<void> {
    const payload = wallet.toPersistence();
    const { error } = await this.client.from('wallets').insert(payload);

    if (error) {
      throw new DatabaseError('create wallet', error.message);
    }
  }

  /**
   * Saves updates to an existing wallet with optimistic locking.
   * Checks that the database version equals (wallet.version - 1).
   *
   * @param wallet - Modified wallet entity
   * @throws {ConcurrencyError} When a concurrent modification occurs
   */
  async save(wallet: Wallet): Promise<void> {
    const payload = wallet.toPersistence();
    const expectedDbVersion = wallet.version - 1;

    const { data, error } = await this.client
      .from('wallets')
      .update(payload)
      .eq('id', wallet.id)
      .eq('version', expectedDbVersion)
      .select('id');

    if (error) {
      throw new DatabaseError('save wallet', error.message);
    }

    if (!data || data.length === 0) {
      throw new ConcurrencyError(
        `Wallet '${wallet.id}' version conflict. Expected version ${expectedDbVersion}.`,
      );
    }
  }

  /**
   * Converts a database row to a Wallet domain entity.
   */
  private toDomain(row: WalletRow): Wallet {
    return Wallet.fromPersistence({
      id: row.id,
      user_id: row.user_id,
      available_balance: Number(row.available_balance),
      frozen_balance: Number(row.frozen_balance),
      total_earned: Number(row.total_earned),
      total_spent: Number(row.total_spent),
      version: row.version,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
