import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { FreezeForEscrowDTO, WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import {
  NotFoundError,
  InsufficientFundsError,
  InvalidAmountError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Freeze funds from buyer available balance into escrow locked balance.
 */
export class FreezeForEscrow {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Freezes amount from available balance to frozen balance.
   *
   * @param dto - Freeze parameters
   * @returns Updated wallet balance details
   * @throws {InvalidAmountError} If amount is invalid
   * @throws {NotFoundError} If wallet is not found
   * @throws {InsufficientFundsError} If available funds are insufficient
   */
  async execute(dto: FreezeForEscrowDTO): Promise<WalletBalanceDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', dto.userId);
    }

    wallet.freeze(dto.amount);
    await this.walletRepository.save(wallet);

    // Ledger entry
    const ledgerEntry = TransactionLedger.create({
      walletId: wallet.id,
      type: 'ESCROW_FREEZE',
      amount: dto.amount,
      balanceAfter: wallet.availableBalance,
      referenceId: dto.escrowTransactionId,
      description: `Funds locked in escrow (Tx: ${dto.escrowTransactionId})`,
    });
    await this.ledgerRepository.create(ledgerEntry);

    // Audit log
    await this.auditLogger.log({
      entity: 'wallet',
      entityId: wallet.id,
      action: 'ESCROW_FUNDS_FROZEN',
      actorId: dto.userId,
      metadata: {
        escrowTransactionId: dto.escrowTransactionId,
        amount: dto.amount,
        frozenBalance: wallet.frozenBalance,
        availableBalance: wallet.availableBalance,
      },
    });

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
