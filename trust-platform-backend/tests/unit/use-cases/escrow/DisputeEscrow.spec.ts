import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputeEscrow } from '../../../../src/application/use-cases/escrow/DisputeEscrow.js';
import type { IEscrowRepository } from '../../../../src/application/interfaces/IEscrowRepository.js';
import type { IEscrowQueue } from '../../../../src/application/interfaces/IEscrowQueue.js';
import type { FreezeForEscrow } from '../../../../src/application/use-cases/wallet/FreezeForEscrow.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { EscrowTransaction } from '../../../../src/domain/entities/EscrowTransaction.js';
import { IllegalStateTransitionError, ValidationError } from '../../../../src/shared/errors/index.js';

describe('DisputeEscrow Use Case', () => {
  let escrowRepo: IEscrowRepository;
  let escrowQueue: IEscrowQueue;
  let freezeForEscrow: FreezeForEscrow;
  let auditLogger: IAuditLogger;
  let useCase: DisputeEscrow;

  const buyerId = 'buyer-dispute-1';
  const sellerId = 'seller-dispute-1';
  const escrowId = 'escrow-dispute-100';

  beforeEach(() => {
    escrowRepo = {
      findById: vi.fn(),
      findByBuyerId: vi.fn(),
      findBySellerId: vi.fn(),
      create: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    escrowQueue = {
      scheduleAutoRelease: vi.fn().mockResolvedValue(undefined),
      cancelAutoRelease: vi.fn().mockResolvedValue(undefined),
    };
    freezeForEscrow = {
      execute: vi.fn().mockResolvedValue({} as any),
    } as any;
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DisputeEscrow(
      escrowRepo,
      escrowQueue,
      freezeForEscrow,
      auditLogger,
    );
  });

  it('freezes 5% dispute deposit, cancels auto-release timer, and transitions to DISPUTED', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 100000, // ₹1,000.00
      platformFee: 5000,
    });
    escrow.transition('FUNDED_IN_ESCROW', buyerId);
    escrow.transition('DELIVERED', sellerId);
    escrow.transition('INSPECTION_PERIOD', buyerId);
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    const result = await useCase.execute({
      escrowTransactionId: escrowId,
      buyerId,
      reason: 'The digital game account password has been changed by seller',
      evidenceUrls: ['https://cdn.evidence.io/screenshot.png'],
    });

    expect(result.status).toBe('DISPUTED');
    expect(escrowQueue.cancelAutoRelease).toHaveBeenCalledWith(escrowId);
    // 5% of 100000 = 5000 paise
    expect(freezeForEscrow.execute).toHaveBeenCalledWith({
      userId: buyerId,
      amount: 5000,
      escrowTransactionId: escrowId,
    });
    expect(escrowRepo.save).toHaveBeenCalledWith(escrow);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ESCROW_DISPUTED',
      }),
    );
  });

  it('throws ValidationError if reason is shorter than 10 characters', async () => {
    await expect(
      useCase.execute({
        escrowTransactionId: escrowId,
        buyerId,
        reason: 'bad',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws IllegalStateTransitionError if escrow is not in INSPECTION_PERIOD', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 100000,
      platformFee: 5000,
    });
    // Escrow is still INITIATED
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    await expect(
      useCase.execute({
        escrowTransactionId: escrowId,
        buyerId,
        reason: 'Item is not as described and unusable',
      }),
    ).rejects.toThrow(IllegalStateTransitionError);
  });
});
