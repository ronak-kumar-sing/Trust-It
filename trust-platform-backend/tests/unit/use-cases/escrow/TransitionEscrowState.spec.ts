import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransitionEscrowState } from '../../../../src/application/use-cases/escrow/TransitionEscrowState.js';
import type { IEscrowRepository } from '../../../../src/application/interfaces/IEscrowRepository.js';
import type { IEscrowQueue } from '../../../../src/application/interfaces/IEscrowQueue.js';
import type { ReleaseFromEscrow } from '../../../../src/application/use-cases/wallet/ReleaseFromEscrow.js';
import type { RefundFromEscrow } from '../../../../src/application/use-cases/wallet/RefundFromEscrow.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { EscrowTransaction } from '../../../../src/domain/entities/EscrowTransaction.js';
import { IllegalStateTransitionError } from '../../../../src/shared/errors/index.js';

describe('TransitionEscrowState Use Case', () => {
  let escrowRepo: IEscrowRepository;
  let escrowQueue: IEscrowQueue;
  let releaseFromEscrow: ReleaseFromEscrow;
  let refundFromEscrow: RefundFromEscrow;
  let auditLogger: IAuditLogger;
  let useCase: TransitionEscrowState;

  const buyerId = 'buyer-1';
  const sellerId = 'seller-1';
  const escrowId = 'escrow-flow-1';

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
    releaseFromEscrow = {
      execute: vi.fn().mockResolvedValue({} as any),
    } as any;
    refundFromEscrow = {
      execute: vi.fn().mockResolvedValue({} as any),
    } as any;
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new TransitionEscrowState(
      escrowRepo,
      escrowQueue,
      releaseFromEscrow,
      refundFromEscrow,
      auditLogger,
    );
  });

  it('DELIVERED -> INSPECTION_PERIOD sets deadline and schedules auto-release timer', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 60000,
      platformFee: 3000,
    });
    escrow.transition('FUNDED_IN_ESCROW', buyerId);
    escrow.transition('DELIVERED', sellerId);
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    const result = await useCase.execute({
      escrowTransactionId: escrowId,
      targetState: 'INSPECTION_PERIOD',
      actorId: buyerId,
    });

    expect(result.status).toBe('INSPECTION_PERIOD');
    expect(result.inspectionDeadline).toBeDefined();
    expect(escrowQueue.scheduleAutoRelease).toHaveBeenCalledWith(
      escrowId,
      48 * 60 * 60 * 1000, // 48 hours
    );
    expect(escrowRepo.save).toHaveBeenCalledWith(escrow);
  });

  it('INSPECTION_PERIOD -> RELEASED releases funds to seller and cancels timer', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 60000,
      platformFee: 3000,
    });
    escrow.transition('FUNDED_IN_ESCROW', buyerId);
    escrow.transition('DELIVERED', sellerId);
    escrow.transition('INSPECTION_PERIOD', buyerId);
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    const result = await useCase.execute({
      escrowTransactionId: escrowId,
      targetState: 'RELEASED',
      actorId: buyerId,
    });

    expect(result.status).toBe('RELEASED');
    expect(escrowQueue.cancelAutoRelease).toHaveBeenCalledWith(escrowId);
    expect(releaseFromEscrow.execute).toHaveBeenCalledWith({
      buyerId,
      sellerId,
      amount: 60000,
      platformFee: 3000,
      escrowTransactionId: escrowId,
    });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STATE_CHANGE:INSPECTION_PERIOD→RELEASED',
      }),
    );
  });

  it('INSPECTION_PERIOD -> REFUNDED returns funds to buyer and cancels timer', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 60000,
      platformFee: 3000,
    });
    escrow.transition('FUNDED_IN_ESCROW', buyerId);
    escrow.transition('DELIVERED', sellerId);
    escrow.transition('INSPECTION_PERIOD', buyerId);
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    const result = await useCase.execute({
      escrowTransactionId: escrowId,
      targetState: 'REFUNDED',
      actorId: sellerId,
    });

    expect(result.status).toBe('REFUNDED');
    expect(escrowQueue.cancelAutoRelease).toHaveBeenCalledWith(escrowId);
    expect(refundFromEscrow.execute).toHaveBeenCalledWith({
      buyerId,
      amount: 60000,
      escrowTransactionId: escrowId,
    });
  });

  it('throws IllegalStateTransitionError on invalid transition', async () => {
    const escrow = EscrowTransaction.create({
      id: escrowId,
      type: 'DIGITAL_GOODS',
      buyerId,
      sellerId,
      amount: 60000,
      platformFee: 3000,
    });
    vi.mocked(escrowRepo.findById).mockResolvedValue(escrow);

    // INITIATED -> RELEASED is illegal
    await expect(
      useCase.execute({
        escrowTransactionId: escrowId,
        targetState: 'RELEASED',
        actorId: buyerId,
      }),
    ).rejects.toThrow(IllegalStateTransitionError);
  });
});
