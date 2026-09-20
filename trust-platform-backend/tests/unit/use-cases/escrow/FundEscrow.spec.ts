import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FundEscrow } from '../../../../src/application/use-cases/escrow/FundEscrow.js';
import type { IEscrowRepository } from '../../../../src/application/interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import type { FreezeForEscrow } from '../../../../src/application/use-cases/wallet/FreezeForEscrow.js';
import { EscrowTransaction } from '../../../../src/domain/entities/EscrowTransaction.js';
import { NotFoundError, ForbiddenError } from '../../../../src/shared/errors/index.js';

describe('FundEscrow Use Case', () => {
  let escrowRepo: IEscrowRepository;
  let freezeForEscrow: FreezeForEscrow;
  let auditLogger: IAuditLogger;
  let useCase: FundEscrow;

  const buyerId = 'buyer-abc';
  const sellerId = 'seller-xyz';
  const escrowId = 'escrow-101';

  beforeEach(() => {
    escrowRepo = {
      findById: vi.fn(),
      findByBuyerId: vi.fn(),
      findBySellerId: vi.fn(),
      create: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    freezeForEscrow = {
      execute: vi.fn().mockResolvedValue({} as any),
    } as any;
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new FundEscrow(escrowRepo, freezeForEscrow, auditLogger);
  });

  it('freezes buyer balance and transitions escrow to FUNDED_IN_ESCROW', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 50000,
      platformFee: 2500,
    });
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    const result = await useCase.execute({
      escrowTransactionId: escrowId,
      buyerId,
    });

    expect(result.status).toBe('FUNDED_IN_ESCROW');
    expect(freezeForEscrow.execute).toHaveBeenCalledWith({
      userId: buyerId,
      amount: 50000,
      escrowTransactionId: escrowId,
    });
    expect(escrowRepo.save).toHaveBeenCalledWith(escrow);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STATE_CHANGE:INITIATED→FUNDED_IN_ESCROW',
      }),
    );
  });

  it('throws ForbiddenError if actor is not the buyer', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 50000,
      platformFee: 2500,
    });
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    await expect(
      useCase.execute({
        escrowTransactionId: escrowId,
        buyerId: 'stranger-id',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError if escrow is not found', async () => {
    vi.mocked(escrowRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        escrowTransactionId: 'non-existent',
        buyerId,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
