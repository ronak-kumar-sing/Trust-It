import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { IEscrowQueue } from '../../interfaces/IEscrowQueue.js';
import type { FreezeForEscrow } from '../wallet/FreezeForEscrow.js';
import type { DisputeEscrowDTO, EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  IllegalStateTransitionError,
  ValidationError,
} from '../../../shared/errors/index.js';
import { PLATFORM_FEES } from '../../../shared/constants/index.js';

/**
 * Use case: Raise a formal dispute during the inspection period.
 * Requires 5% dispute deposit from buyer, cancels auto-release timer,
 * and transitions state to DISPUTED.
 */
export class DisputeEscrow {
  constructor(
    private readonly escrowRepository: IEscrowRepository,
    private readonly escrowQueue: IEscrowQueue,
    private readonly freezeForEscrow: FreezeForEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Freezes dispute deposit, cancels auto-release timer, and transitions escrow to DISPUTED.
   *
   * @param dto - Dispute parameters
   * @returns Updated escrow details
   * @throws {NotFoundError} When escrow does not exist
   * @throws {ForbiddenError} When actor is not the buyer
   * @throws {IllegalStateTransitionError} When escrow is not in INSPECTION_PERIOD
   */
  async execute(dto: DisputeEscrowDTO): Promise<EscrowDetailsDTO> {
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new ValidationError('Dispute reason must be at least 10 characters');
    }

    const escrow = await this.escrowRepository.findById(dto.escrowTransactionId);
    if (!escrow) {
      throw new NotFoundError('EscrowTransaction', dto.escrowTransactionId);
    }

    if (escrow.buyerId !== dto.buyerId) {
      throw new ForbiddenError('Only the buyer can raise a dispute during inspection');
    }

    if (!escrow.isDisputable) {
      throw new IllegalStateTransitionError(escrow.status, 'DISPUTED');
    }

    // 1. Cancel auto-release timer
    await this.escrowQueue.cancelAutoRelease(escrow.id);

    // 2. Enforce 5% dispute deposit from buyer
    const disputeDeposit = Math.max(
      100, // min ₹1
      Math.round((escrow.amount * PLATFORM_FEES.DISPUTE_DEPOSIT) / 10000),
    );

    await this.freezeForEscrow.execute({
      userId: dto.buyerId,
      amount: disputeDeposit,
      escrowTransactionId: escrow.id,
    });

    // 3. Transition state to DISPUTED
    const event = escrow.transition('DISPUTED', dto.buyerId);

    // 4. Save with optimistic locking
    await this.escrowRepository.save(escrow);

    // 5. Emit audit event
    await this.auditLogger.log({
      entity: 'escrow_transaction',
      entityId: escrow.id,
      action: 'ESCROW_DISPUTED',
      actorId: dto.buyerId,
      metadata: {
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls ?? [],
        disputeDeposit,
      },
    });

    return {
      id: escrow.id,
      type: escrow.type,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      amount: escrow.amount,
      platformFee: escrow.platformFee,
      status: escrow.status,
      inspectionDeadline: escrow.inspectionDeadline?.toISOString() ?? null,
      version: escrow.version,
      metadata: escrow.metadata,
      createdAt: escrow.createdAt.toISOString(),
      updatedAt: escrow.updatedAt.toISOString(),
    };
  }
}
