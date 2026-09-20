import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetWalletBalance } from '../../../../src/application/use-cases/wallet/GetWalletBalance.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { NotFoundError } from '../../../../src/shared/errors/index.js';

describe('GetWalletBalance Use Case', () => {
  let walletRepo: IWalletRepository;
  let useCase: GetWalletBalance;
  const userId = 'user-abc';

  beforeEach(() => {
    walletRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new GetWalletBalance(walletRepo);
  });

  it('returns wallet balances when wallet exists', async () => {
    const wallet = Wallet.create('wallet-1', userId);
    wallet.credit(50000); // 50000 available
    wallet.freeze(20000); // 30000 available, 20000 frozen
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    const result = await useCase.execute(userId);

    expect(result.walletId).toBe('wallet-1');
    expect(result.userId).toBe(userId);
    expect(result.availableBalance).toBe(30000);
    expect(result.frozenBalance).toBe(20000);
    expect(result.totalBalance).toBe(50000);
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(null);

    await expect(useCase.execute('unknown-user')).rejects.toThrow(NotFoundError);
  });
});
