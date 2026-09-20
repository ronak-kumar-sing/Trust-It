import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { WithdrawFundsDTO, WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import {
  NotFoundError,
  InsufficientFundsError,
  InvalidAmountError,
} from '../../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * Use case: Withdraw funds from user wallet to external payout account.
 */
export class WithdrawFunds {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Debits available balance for withdrawal and appends ledger record.
   *
   * @param dto - Withdrawal parameters
   * @returns Updated wallet balance details
   * @throws {InvalidAmountError} If amount is invalid
   * @throws {NotFoundError} If wallet is not found
   * @throws {InsufficientFundsError} If balance is less than requested amount
   */
  async execute(dto: WithdrawFundsDTO): Promise<WalletBalanceDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', dto.userId);
    }

    // Debit available balance (enforces wallet invariant)
    wallet.debit(dto.amount);
    await this.walletRepository.save(wallet);

    const withdrawalRef = `wth_${nanoid(12)}`;

    // Append ledger entry
    const ledgerEntry = TransactionLedger.create({
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount: dto.amount,
      balanceAfter: wallet.availableBalance,
      referenceId: withdrawalRef,
      description: `Payout withdrawal${dto.destinationAccount ? ` to ${dto.destinationAccount}` : ''}`,
    });
    await this.ledgerRepository.create(ledgerEntry);

    // Record audit event
    await this.auditLogger.log({
      entity: 'wallet',
      entityId: wallet.id,
      action: 'WITHDRAWAL_REQUESTED',
      actorId: dto.userId,
      metadata: {
        withdrawalRef,
        amount: dto.amount,
        destinationAccount: dto.destinationAccount ?? null,
        newBalance: wallet.availableBalance,
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
