import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefundFromEscrow } from '../../../../src/application/use-cases/wallet/RefundFromEscrow.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../../../src/application/interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';

describe('RefundFromEscrow Use Case', () => {
  let walletRepo: IWalletRepository;
  let ledgerRepo: ITransactionLedgerRepository;
  let auditLogger: IAuditLogger;
  let useCase: RefundFromEscrow;
  const buyerId = 'buyer-refund-1';

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
    useCase = new RefundFromEscrow(walletRepo, ledgerRepo, auditLogger);
  });

  it('unfreezes funds back to available balance and records refund ledger', async () => {
    const buyerWallet = Wallet.create('w-buyer-refund', buyerId);
    buyerWallet.credit(50000);
    buyerWallet.freeze(50000); // 0 available, 50000 frozen
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(buyerWallet);

    const result = await useCase.execute({
      buyerId,
      amount: 50000,
      escrowTransactionId: 'escrow-cancel-1',
    });

    expect(result.availableBalance).toBe(50000);
    expect(result.frozenBalance).toBe(0);
    expect(walletRepo.save).toHaveBeenCalledWith(buyerWallet);
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESCROW_REFUND',
        amount: 50000,
        referenceId: 'escrow-cancel-1',
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ESCROW_FUNDS_REFUNDED',
        actorId: buyerId,
      }),
    );
  });
});
