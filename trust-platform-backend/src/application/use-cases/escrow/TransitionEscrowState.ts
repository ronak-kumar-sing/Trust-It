import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { IEscrowQueue } from '../../interfaces/IEscrowQueue.js';
import type { ReleaseFromEscrow } from '../wallet/ReleaseFromEscrow.js';
import type { RefundFromEscrow } from '../wallet/RefundFromEscrow.js';
import type { TransitionEscrowDTO, EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { INSPECTION_WINDOWS } from '../../../shared/constants/index.js';
import { hoursToMs } from '../../../shared/utils/index.js';

/**
 * Use case: Transition an escrow transaction to a target state.
 * Validates transition legality, coordinates side effects (wallet balance release/refund,
 * delayed timer scheduling), updates entity with optimistic locking, and logs audit events.
 */
export class TransitionEscrowState {
  constructor(
    private readonly escrowRepository: IEscrowRepository,
    private readonly escrowQueue: IEscrowQueue,
    private readonly releaseFromEscrow: ReleaseFromEscrow,
    private readonly refundFromEscrow: RefundFromEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Executes the state transition and associated financial/timer side effects.
   *
   * @param dto - Transaction ID, target state, and actor ID
   * @returns Updated escrow representation
   * @throws {NotFoundError} When escrow does not exist
   * @throws {IllegalStateTransitionError} When state transition is illegal
   */
  async execute(dto: TransitionEscrowDTO): Promise<EscrowDetailsDTO> {
    const escrow = await this.escrowRepository.findById(dto.escrowTransactionId);
    if (!escrow) {
      throw new NotFoundError('EscrowTransaction', dto.escrowTransactionId);
    }

    const previousStatus = escrow.status;
    const event = escrow.transition(dto.targetState, dto.actorId);

    // ── Handle Side Effects ───────────────────────────────────────
    if (dto.targetState === 'INSPECTION_PERIOD') {
      let windowHours: number = INSPECTION_WINDOWS.DIGITAL_GOODS;
      if (escrow.type === 'FREELANCE_MILESTONE') {
        windowHours = INSPECTION_WINDOWS.FREELANCE_MILESTONE;
      } else if (escrow.type === 'GAMING_WAGER') {
        windowHours = INSPECTION_WINDOWS.GAMING_WAGER_RESPONSE;
      }

      const delayMs = hoursToMs(windowHours);
      const deadline = new Date(Date.now() + delayMs);
      escrow.setInspectionDeadline(deadline);

      await this.escrowQueue.scheduleAutoRelease(escrow.id, delayMs);
    } else if (dto.targetState === 'RELEASED') {
      await this.escrowQueue.cancelAutoRelease(escrow.id);
      await this.releaseFromEscrow.execute({
        buyerId: escrow.buyerId,
        sellerId: escrow.sellerId,
        amount: escrow.amount,
        platformFee: escrow.platformFee,
        escrowTransactionId: escrow.id,
      });
    } else if (dto.targetState === 'REFUNDED') {
      await this.escrowQueue.cancelAutoRelease(escrow.id);
      await this.refundFromEscrow.execute({
        buyerId: escrow.buyerId,
        amount: escrow.amount,
        escrowTransactionId: escrow.id,
      });
    } else if (dto.targetState === 'CANCELLED') {
      await this.escrowQueue.cancelAutoRelease(escrow.id);
      if (previousStatus === 'FUNDED_IN_ESCROW') {
        await this.refundFromEscrow.execute({
          buyerId: escrow.buyerId,
          amount: escrow.amount,
          escrowTransactionId: escrow.id,
        });
      }
    }

    // Persist with optimistic locking
    await this.escrowRepository.save(escrow);

    // Emit audit log
    await this.auditLogger.log({
      entity: 'escrow_transaction',
      entityId: escrow.id,
      action: `STATE_CHANGE:${event.fromState}→${event.toState}`,
      actorId: event.actorId,
      metadata: {
        amount: escrow.amount,
        targetState: dto.targetState,
        deadline: escrow.inspectionDeadline?.toISOString() ?? null,
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
