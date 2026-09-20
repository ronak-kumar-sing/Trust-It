import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FreezeForEscrow } from '../../../../src/application/use-cases/wallet/FreezeForEscrow.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../../../src/application/interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { InsufficientFundsError } from '../../../../src/shared/errors/index.js';

describe('FreezeForEscrow Use Case', () => {
  let walletRepo: IWalletRepository;
  let ledgerRepo: ITransactionLedgerRepository;
  let auditLogger: IAuditLogger;
  let useCase: FreezeForEscrow;
  const userId = 'buyer-1';

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
    useCase = new FreezeForEscrow(walletRepo, ledgerRepo, auditLogger);
  });

  it('freezes available funds into frozen balance and writes ledger record', async () => {
    const wallet = Wallet.create('w-buyer', userId);
    wallet.credit(100000); // 100000 available
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    const result = await useCase.execute({
      userId,
      amount: 40000,
      escrowTransactionId: 'escrow-tx-100',
    });

    expect(result.availableBalance).toBe(60000);
    expect(result.frozenBalance).toBe(40000);
    expect(walletRepo.save).toHaveBeenCalledWith(wallet);
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESCROW_FREEZE',
        amount: 40000,
        referenceId: 'escrow-tx-100',
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ESCROW_FUNDS_FROZEN',
        actorId: userId,
      }),
    );
  });

  it('throws InsufficientFundsError when available funds are lower than escrow amount', async () => {
    const wallet = Wallet.create('w-buyer', userId);
    wallet.credit(10000);
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    await expect(
      useCase.execute({
        userId,
        amount: 50000,
        escrowTransactionId: 'escrow-tx-100',
      }),
    ).rejects.toThrow(InsufficientFundsError);
  });
});
