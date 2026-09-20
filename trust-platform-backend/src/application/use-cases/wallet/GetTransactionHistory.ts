import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { TransactionLedgerDTO } from '../../dtos/wallet.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve transaction ledger history for a user's wallet.
 */
export class GetTransactionHistory {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
  ) {}

  /**
   * Retrieves transaction ledger history.
   *
   * @param userId - User UUID
   * @param limit - Pagination limit
   * @param offset - Pagination offset
   * @returns Array of transaction ledger DTOs
   */
  async execute(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TransactionLedgerDTO[]> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', userId);
    }

    const records = await this.ledgerRepository.findByWalletId(wallet.id, limit, offset);

    return records.map((entry) => ({
      id: entry.id,
      walletId: entry.walletId,
      type: entry.type,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      referenceId: entry.referenceId,
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    }));
  }
}
