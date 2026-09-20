import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerifyAndCreditDeposit } from '../../../../src/application/use-cases/wallet/VerifyAndCreditDeposit.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../../../src/application/interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import type { IPaymentGateway } from '../../../../src/application/interfaces/IPaymentGateway.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { ValidationError, NotFoundError } from '../../../../src/shared/errors/index.js';

describe('VerifyAndCreditDeposit Use Case', () => {
  let walletRepo: IWalletRepository;
  let ledgerRepo: ITransactionLedgerRepository;
  let auditLogger: IAuditLogger;
  let paymentGateway: IPaymentGateway;
  let useCase: VerifyAndCreditDeposit;
  const userId = 'user-deposit-2';

  beforeEach(() => {
    walletRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };
    ledgerRepo = {
      create: vi.fn().mockResolvedValue(undefined),
      findByWalletId: vi.fn().mockResolvedValue([]),
    };
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    paymentGateway = {
      createOrder: vi.fn(),
      verifyPaymentSignature: vi.fn().mockReturnValue(true),
      processRefund: vi.fn(),
    };
    useCase = new VerifyAndCreditDeposit(
      walletRepo,
      ledgerRepo,
      auditLogger,
      paymentGateway,
    );
  });

  it('credits deposit upon valid signature and writes ledger entry', async () => {
    const wallet = Wallet.create('w2', userId);
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    const result = await useCase.execute({
      userId,
      orderId: 'order_123',
      paymentId: 'pay_456',
      signature: 'valid_sig_xyz',
      amount: 100000, // ₹1,000.00
    });

    expect(result.availableBalance).toBe(100000);
    expect(result.totalBalance).toBe(100000);
    expect(walletRepo.save).toHaveBeenCalledWith(wallet);
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEPOSIT',
        amount: 100000,
        referenceId: 'pay_456',
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DEPOSIT_PROCESSED',
        actorId: userId,
      }),
    );
  });

  it('throws ValidationError if payment gateway signature fails verification', async () => {
    vi.mocked(paymentGateway.verifyPaymentSignature).mockReturnValue(false);

    await expect(
      useCase.execute({
        userId,
        orderId: 'order_123',
        paymentId: 'pay_fake',
        signature: 'tampered_sig',
        amount: 50000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError if wallet does not exist', async () => {
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'no-wallet',
        orderId: 'order_123',
        paymentId: 'pay_456',
        signature: 'valid_sig',
        amount: 50000,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
