import type { EscrowTransaction } from '../../domain/entities/EscrowTransaction.js';
import type { EscrowStatusType } from '../../domain/enums/index.js';

/**
 * Port interface for EscrowTransaction persistence operations.
 * Implemented by infrastructure layer (SupabaseEscrowRepository).
 * All write operations must use optimistic locking.
 */
export interface IEscrowRepository {
  /**
   * Finds an escrow transaction by its UUID.
   *
   * @param id - Escrow transaction UUID
   * @returns The escrow entity, or null if not found
   */
  findById(id: string): Promise<EscrowTransaction | null>;

  /**
   * Finds escrow transactions by buyer ID.
   *
   * @param buyerId - Buyer's user UUID
   * @param status - Optional status filter
   * @returns Array of matching escrow transactions
   */
  findByBuyerId(buyerId: string, status?: EscrowStatusType): Promise<EscrowTransaction[]>;

  /**
   * Finds escrow transactions by seller ID.
   *
   * @param sellerId - Seller's user UUID
   * @param status - Optional status filter
   * @returns Array of matching escrow transactions
   */
  findBySellerId(sellerId: string, status?: EscrowStatusType): Promise<EscrowTransaction[]>;

  /**
   * Creates a new escrow transaction in the database.
   *
   * @param escrow - EscrowTransaction entity to persist
   */
  create(escrow: EscrowTransaction): Promise<void>;

  /**
   * Saves (updates) an escrow transaction with optimistic locking.
   *
   * @param escrow - EscrowTransaction entity with updated fields
   * @throws {ConcurrencyError} if version doesn't match
   */
  save(escrow: EscrowTransaction): Promise<void>;
}
