import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDepositOrder } from '../../../../src/application/use-cases/wallet/CreateDepositOrder.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { IPaymentGateway } from '../../../../src/application/interfaces/IPaymentGateway.js';
import { Wallet } from '../../../../src/domain/entities/Wallet.js';
import { NotFoundError, InvalidAmountError } from '../../../../src/shared/errors/index.js';

describe('CreateDepositOrder Use Case', () => {
  let walletRepo: IWalletRepository;
  let paymentGateway: IPaymentGateway;
  let useCase: CreateDepositOrder;
  const userId = 'user-deposit-1';

  beforeEach(() => {
    walletRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };
    paymentGateway = {
      createOrder: vi.fn().mockResolvedValue({
        orderId: 'order_123',
        amount: 25000,
        currency: 'INR',
      }),
      verifyPaymentSignature: vi.fn().mockReturnValue(true),
      processRefund: vi.fn().mockResolvedValue({ refundId: 'rfnd_1', status: 'processed' }),
    };
    useCase = new CreateDepositOrder(walletRepo, paymentGateway);
  });

  it('creates a deposit order successfully', async () => {
    const wallet = Wallet.create('w1', userId);
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(wallet);

    const result = await useCase.execute({
      userId,
      amount: 25000,
    });

    expect(result.orderId).toBe('order_123');
    expect(result.amount).toBe(25000);
    expect(result.currency).toBe('INR');
    expect(paymentGateway.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25000,
        currency: 'INR',
      }),
    );
  });

  it('throws InvalidAmountError when deposit amount is not a positive integer', async () => {
    await expect(
      useCase.execute({
        userId,
        amount: -500,
      }),
    ).rejects.toThrow(InvalidAmountError);
  });

  it('throws NotFoundError if wallet does not exist for user', async () => {
    vi.mocked(walletRepo.findByUserId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'no-wallet-user',
        amount: 10000,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
