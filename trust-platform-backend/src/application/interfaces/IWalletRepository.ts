import type { Wallet } from '../../domain/entities/Wallet.js';

/**
 * Port interface for Wallet persistence operations.
 * Implemented by infrastructure layer (SupabaseWalletRepository).
 * All write operations must use optimistic locking.
 */
export interface IWalletRepository {
  /**
   * Finds a wallet by its UUID.
   *
   * @param id - Wallet UUID
   * @returns The wallet entity, or null if not found
   */
  findById(id: string): Promise<Wallet | null>;

  /**
   * Finds a wallet by the owning user's UUID.
   *
   * @param userId - User UUID
   * @returns The wallet entity, or null if not found
   */
  findByUserId(userId: string): Promise<Wallet | null>;

  /**
   * Creates a new wallet in the database.
   *
   * @param wallet - Wallet entity to persist
   */
  create(wallet: Wallet): Promise<void>;

  /**
   * Saves (updates) a wallet with optimistic locking.
   * The version field must match the current database version.
   *
   * @param wallet - Wallet entity with updated fields and incremented version
   * @throws {ConcurrencyError} if the version doesn't match (concurrent modification)
   */
  save(wallet: Wallet): Promise<void>;
}
