import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateEscrow } from '../../../../src/application/use-cases/escrow/CreateEscrow.js';
import type { IEscrowRepository } from '../../../../src/application/interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { ValidationError, InvalidAmountError } from '../../../../src/shared/errors/index.js';

describe('CreateEscrow Use Case', () => {
  let escrowRepo: IEscrowRepository;
  let auditLogger: IAuditLogger;
  let useCase: CreateEscrow;

  const buyerId = 'buyer-111';
  const sellerId = 'seller-222';

  beforeEach(() => {
    escrowRepo = {
      findById: vi.fn(),
      findByBuyerId: vi.fn(),
      findBySellerId: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new CreateEscrow(escrowRepo, auditLogger);
  });

  it('creates an escrow with 5% platform fee and logs audit event', async () => {
    const result = await useCase.execute({
      buyerId,
      sellerId,
      type: 'DIGITAL_GOODS',
      amount: 100000, // ₹1,000.00
      metadata: { itemName: 'Steam Account' },
    });

    expect(result.id).toBeDefined();
    expect(result.buyerId).toBe(buyerId);
    expect(result.sellerId).toBe(sellerId);
    expect(result.amount).toBe(100000);
    expect(result.platformFee).toBe(5000); // 5% of 100000
    expect(result.status).toBe('INITIATED');
    expect(result.inspectionDeadline).toBeNull();
    expect(result.version).toBe(1);

    expect(escrowRepo.create).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'escrow_transaction',
        action: 'ESCROW_CREATED',
      }),
    );
  });

  it('throws ValidationError if buyer and seller are the same user', async () => {
    await expect(
      useCase.execute({
        buyerId: 'same-user',
        sellerId: 'same-user',
        type: 'DIGITAL_GOODS',
        amount: 50000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws InvalidAmountError if amount is not a positive integer', async () => {
    await expect(
      useCase.execute({
        buyerId,
        sellerId,
        type: 'DIGITAL_GOODS',
        amount: 0,
      }),
    ).rejects.toThrow(InvalidAmountError);
  });
});
