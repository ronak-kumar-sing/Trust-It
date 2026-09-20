import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { RefundFromEscrowDTO, WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import {
  NotFoundError,
  InvalidAmountError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Refund escrow funds back to the buyer upon cancellation or dispute resolution.
 * Moves frozen balance back to available balance.
 */
export class RefundFromEscrow {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Reverses frozen balance back to available for buyer.
   *
   * @param dto - Refund parameters
   * @returns Buyer updated wallet balance details
   */
  async execute(dto: RefundFromEscrowDTO): Promise<WalletBalanceDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    const buyerWallet = await this.walletRepository.findByUserId(dto.buyerId);
    if (!buyerWallet) {
      throw new NotFoundError('Buyer wallet for user', dto.buyerId);
    }

    buyerWallet.refund(dto.amount);
    await this.walletRepository.save(buyerWallet);

    const refundLedger = TransactionLedger.create({
      walletId: buyerWallet.id,
      type: 'ESCROW_REFUND',
      amount: dto.amount,
      balanceAfter: buyerWallet.availableBalance,
      referenceId: dto.escrowTransactionId,
      description: `Escrow refund returned to available balance (Tx: ${dto.escrowTransactionId})`,
    });
    await this.ledgerRepository.create(refundLedger);

    await this.auditLogger.log({
      entity: 'wallet',
      entityId: buyerWallet.id,
      action: 'ESCROW_FUNDS_REFUNDED',
      actorId: dto.buyerId,
      metadata: {
        escrowTransactionId: dto.escrowTransactionId,
        refundAmount: dto.amount,
        availableBalance: buyerWallet.availableBalance,
      },
    });

    return {
      walletId: buyerWallet.id,
      userId: buyerWallet.userId,
      availableBalance: buyerWallet.availableBalance,
      frozenBalance: buyerWallet.frozenBalance,
      totalBalance: buyerWallet.totalBalance,
      totalEarned: buyerWallet.totalEarned,
      totalSpent: buyerWallet.totalSpent,
      version: buyerWallet.version,
    };
  }
}
