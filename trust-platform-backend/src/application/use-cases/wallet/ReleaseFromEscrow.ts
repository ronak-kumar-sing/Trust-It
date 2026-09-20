import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { ReleaseFromEscrowDTO, WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import {
  NotFoundError,
  ValidationError,
  InvalidAmountError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Release escrow funds to seller upon completed transaction or inspection expiry.
 * Deducts platform fee and credits net amount to seller wallet.
 */
export class ReleaseFromEscrow {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Credits seller wallet with net amount after platform fee.
   *
   * @param dto - Release parameters
   * @returns Seller wallet balance details
   */
  async execute(dto: ReleaseFromEscrowDTO): Promise<WalletBalanceDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }
    if (dto.platformFee < 0 || dto.platformFee > dto.amount) {
      throw new ValidationError(
        `Platform fee (${dto.platformFee}) cannot be negative or exceed total amount (${dto.amount})`,
      );
    }

    const netAmount = dto.amount - dto.platformFee;

    const sellerWallet = await this.walletRepository.findByUserId(dto.sellerId);
    if (!sellerWallet) {
      throw new NotFoundError('Seller wallet for user', dto.sellerId);
    }

    // Debit buyer frozen funds if buyerId is provided
    if (dto.buyerId) {
      const buyerWallet = await this.walletRepository.findByUserId(dto.buyerId);
      if (buyerWallet) {
        buyerWallet.debitFrozen(dto.amount);
        await this.walletRepository.save(buyerWallet);
      }
    }

    // Credit net earnings to seller
    sellerWallet.credit(netAmount);
    await this.walletRepository.save(sellerWallet);

    // Record ledger entry for payout release
    const releaseLedger = TransactionLedger.create({
      walletId: sellerWallet.id,
      type: 'ESCROW_RELEASE',
      amount: netAmount,
      balanceAfter: sellerWallet.availableBalance,
      referenceId: dto.escrowTransactionId,
      description: `Escrow payout released (Gross: ₹${dto.amount / 100}, Fee: ₹${dto.platformFee / 100})`,
    });
    await this.ledgerRepository.create(releaseLedger);

    // Record ledger entry for platform fee deduction if fee > 0
    if (dto.platformFee > 0) {
      const feeLedger = TransactionLedger.create({
        walletId: sellerWallet.id,
        type: 'PLATFORM_FEE',
        amount: dto.platformFee,
        balanceAfter: sellerWallet.availableBalance,
        referenceId: dto.escrowTransactionId,
        description: `Platform fee for escrow transaction ${dto.escrowTransactionId}`,
      });
      await this.ledgerRepository.create(feeLedger);
    }

    // Audit log
    await this.auditLogger.log({
      entity: 'wallet',
      entityId: sellerWallet.id,
      action: 'ESCROW_FUNDS_RELEASED',
      actorId: dto.sellerId,
      metadata: {
        escrowTransactionId: dto.escrowTransactionId,
        grossAmount: dto.amount,
        platformFee: dto.platformFee,
        netAmount,
        sellerWalletBalance: sellerWallet.availableBalance,
      },
    });

    return {
      walletId: sellerWallet.id,
      userId: sellerWallet.userId,
      availableBalance: sellerWallet.availableBalance,
      frozenBalance: sellerWallet.frozenBalance,
      totalBalance: sellerWallet.totalBalance,
      totalEarned: sellerWallet.totalEarned,
      totalSpent: sellerWallet.totalSpent,
      version: sellerWallet.version,
    };
  }
}
