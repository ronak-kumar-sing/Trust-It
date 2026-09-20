import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WithdrawFunds } from '../../../../src/application/use-cases/wallet/WithdrawFunds.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { ITransactionLedgerRepository } from '../../../../src/application/interfaces/ITransactionLedgerRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { InsufficientFundsError } from '../../../../src/shared/errors/index.js';

describe('WithdrawFunds Use Case', () => {
  let walletRepo: IWalletRepository;
  let ledgerRepo: ITransactionLedgerRepository;
  let auditLogger: IAuditLogger;
  let useCase: WithdrawFunds;
  const userId = 'user-withdraw';

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
    useCase = new WithdrawFunds(walletRepo, ledgerRepo, auditLogger);
  });

  it('debits available balance and appends ledger record', async () => {
    const wallet = Wallet.create('w3', userId);
    wallet.credit(50000); // 50000 available
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    const result = await useCase.execute({
      userId,
      amount: 20000,
      destinationAccount: 'alice@okhdfcbank',
    });

    expect(result.availableBalance).toBe(30000);
    expect(result.totalBalance).toBe(30000);
    expect(walletRepo.save).toHaveBeenCalledWith(wallet);
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'WITHDRAWAL',
        amount: 20000,
        balanceAfter: 30000,
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WITHDRAWAL_REQUESTED',
        actorId: userId,
      }),
    );
  });

  it('throws InsufficientFundsError when balance is less than withdrawal amount', async () => {
    const wallet = Wallet.create('w3', userId);
    wallet.credit(5000); // Only 5000 available
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    await expect(
      useCase.execute({
        userId,
        amount: 10000,
      }),
    ).rejects.toThrow(InsufficientFundsError);
  });
});
