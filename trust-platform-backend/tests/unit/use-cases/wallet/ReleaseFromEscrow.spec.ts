import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReleaseFromEscrow } from '../../../../src/application/use-cases/wallet/ReleaseFromEscrow.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../../../src/application/interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { ValidationError } from '../../../../src/shared/errors/index.js';

describe('ReleaseFromEscrow Use Case', () => {
  let walletRepo: IWalletRepository;
  let ledgerRepo: ITransactionLedgerRepository;
  let auditLogger: IAuditLogger;
  let useCase: ReleaseFromEscrow;
  const sellerId = 'seller-1';

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
    useCase = new ReleaseFromEscrow(walletRepo, ledgerRepo, auditLogger);
  });

  it('credits net amount (amount - fee) to seller and logs ledger entries', async () => {
    const sellerWallet = Wallet.create('w-seller', sellerId);
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(sellerWallet);

    const grossAmount = 100000; // ₹1,000
    const platformFee = 5000;   // ₹50 (5%)
    const netExpected = 95000;  // ₹950

    const result = await useCase.execute({
      sellerId,
      amount: grossAmount,
      platformFee,
      escrowTransactionId: 'escrow-release-1',
    });

    expect(result.availableBalance).toBe(netExpected);
    expect(sellerWallet.availableBalance).toBe(netExpected);
    expect(walletRepo.save).toHaveBeenCalledWith(sellerWallet);

    // Ledger for release
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESCROW_RELEASE',
        amount: netExpected,
      }),
    );

    // Ledger for fee
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PLATFORM_FEE',
        amount: platformFee,
      }),
    );

    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ESCROW_FUNDS_RELEASED',
        actorId: sellerId,
      }),
    );
  });

  it('throws ValidationError if platform fee exceeds gross amount', async () => {
    await expect(
      useCase.execute({
        sellerId,
        amount: 10000,
        platformFee: 15000,
        escrowTransactionId: 'escrow-err',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
