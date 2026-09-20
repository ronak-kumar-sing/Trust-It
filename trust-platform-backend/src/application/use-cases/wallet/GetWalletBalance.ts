import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve wallet balances for a user.
 */
export class GetWalletBalance {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Retrieves wallet balance details by user ID.
   *
   * @param userId - User UUID
   * @returns Wallet balances in paise
   * @throws {NotFoundError} When no wallet exists for user
   */
  async execute(userId: string): Promise<WalletBalanceDTO> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', userId);
    }

    return {
      walletId: wallet.id,
      userId: wallet.userId,
      availableBalance: wallet.availableBalance,
      frozenBalance: wallet.frozenBalance,
      totalBalance: wallet.totalBalance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      version: wallet.version,
    };
  }
}
