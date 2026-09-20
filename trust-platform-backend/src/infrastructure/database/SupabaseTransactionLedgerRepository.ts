import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITransactionLedgerRepository } from '../../application/interfaces/ITransactionLedgerRepository.js';
import { TransactionLedger } from '../../domain/entities/TransactionLedger.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type { TransactionTypeValue } from '../../domain/enums/TransactionType.js';

interface LedgerRow {
  id: string;
  wallet_id: string;
  type: TransactionTypeValue;
  amount: number | string;
  balance_after: number | string;
  reference_id: string | null;
  description: string;
  created_at: string;
}

/**
 * Supabase implementation of ITransactionLedgerRepository.
 * Handles append-only double-entry financial ledger records.
 */
export class SupabaseTransactionLedgerRepository
  implements ITransactionLedgerRepository
{
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Appends an immutable ledger entry.
   *
   * @param entry - TransactionLedger entity to insert
   */
  async create(entry: TransactionLedger): Promise<void> {
    const payload = entry.toPersistence();
    const { error } = await this.client.from('transactions_ledger').insert(payload);

    if (error) {
      throw new DatabaseError('create ledger entry', error.message);
    }
  }

  /**
   * Retrieves transaction ledger history for a wallet.
   *
   * @param walletId - Target wallet UUID
   * @param limit - Max rows to return (default 50)
   * @param offset - Pagination offset
   */
  async findByWalletId(
    walletId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TransactionLedger[]> {
    const { data, error } = await this.client
      .from('transactions_ledger')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError('findByWalletId ledger', error.message);
    }

    if (!data) return [];
    return data.map((row: LedgerRow) => TransactionLedger.fromPersistence(row));
  }
}
