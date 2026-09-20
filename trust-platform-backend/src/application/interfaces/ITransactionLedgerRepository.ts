import type { TransactionLedger } from '../../domain/entities/TransactionLedger.js';

/**
 * Port interface for TransactionLedger persistence operations.
 * Ledger entries are append-only.
 */
export interface ITransactionLedgerRepository {
  /**
   * Appends an immutable ledger entry.
   *
   * @param entry - The TransactionLedger entity to persist
   */
  create(entry: TransactionLedger): Promise<void>;

  /**
   * Retrieves ledger history for a wallet, ordered by createdAt descending.
   *
   * @param walletId - Wallet UUID
   * @param limit - Max records to return (default 50)
   * @param offset - Pagination offset
   */
  findByWalletId(
    walletId: string,
    limit?: number,
    offset?: number,
  ): Promise<TransactionLedger[]>;
}
