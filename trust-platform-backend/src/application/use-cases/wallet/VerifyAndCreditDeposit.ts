import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { IPaymentGateway } from '../../interfaces/IPaymentGateway.js';
import type { VerifyDepositDTO, WalletBalanceDTO } from '../../dtos/wallet.dto.js';
import { TransactionLedger } from '../../../domain/entities/TransactionLedger.js';
import {
  NotFoundError,
  ValidationError,
  InvalidAmountError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Verify external payment signature, credit wallet balance,
 * create ledger entry, and emit audit event.
 */
export class VerifyAndCreditDeposit {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly ledgerRepository: ITransactionLedgerRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  /**
   * Verifies signature and credits deposited funds.
   *
   * @param dto - Payment proof from gateway checkout
   * @returns Updated wallet balance details
   * @throws {ValidationError} When payment signature is invalid
   * @throws {NotFoundError} When user wallet is not found
   */
  async execute(dto: VerifyDepositDTO): Promise<WalletBalanceDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    const isValid = this.paymentGateway.verifyPaymentSignature({
      orderId: dto.orderId,
      paymentId: dto.paymentId,
      signature: dto.signature,
    });

    if (!isValid) {
      throw new ValidationError('Invalid payment signature verification failed');
    }

    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', dto.userId);
    }

    // Credit available balance
    wallet.credit(dto.amount);
    await this.walletRepository.save(wallet);

    // Record ledger entry
    const ledgerEntry = TransactionLedger.create({
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount: dto.amount,
      balanceAfter: wallet.availableBalance,
      referenceId: dto.paymentId,
      description: `Payment deposit via gateway (Order: ${dto.orderId})`,
    });
    await this.ledgerRepository.create(ledgerEntry);

    // Audit log
    await this.auditLogger.log({
      entity: 'wallet',
      entityId: wallet.id,
      action: 'DEPOSIT_PROCESSED',
      actorId: dto.userId,
      metadata: {
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        amount: dto.amount,
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
