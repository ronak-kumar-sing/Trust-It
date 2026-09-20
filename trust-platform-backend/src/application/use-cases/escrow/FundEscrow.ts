import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { FreezeForEscrow } from '../wallet/FreezeForEscrow.js';
import type { FundEscrowDTO, EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/index.js';

/**
 * Use case: Fund an initiated escrow transaction.
 * Freezes buyer's wallet funds and transitions status to FUNDED_IN_ESCROW.
 */
export class FundEscrow {
  constructor(
    private readonly escrowRepository: IEscrowRepository,
    private readonly freezeForEscrow: FreezeForEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Locks funds from buyer's wallet into escrow.
   *
   * @param dto - Escrow transaction ID and buyer ID
   * @returns Updated escrow details
   * @throws {NotFoundError} When escrow does not exist
   * @throws {ForbiddenError} When actor is not the designated buyer
   */
  async execute(dto: FundEscrowDTO): Promise<EscrowDetailsDTO> {
    const escrow = await this.escrowRepository.findById(dto.escrowTransactionId);
    if (!escrow) {
      throw new NotFoundError('EscrowTransaction', dto.escrowTransactionId);
    }

    if (escrow.buyerId !== dto.buyerId) {
      throw new ForbiddenError('Only the designated buyer can fund this escrow');
    }

    // 1. Freeze buyer wallet balance (throws InsufficientFundsError if balance too low)
    await this.freezeForEscrow.execute({
      userId: escrow.buyerId,
      amount: escrow.amount,
      escrowTransactionId: escrow.id,
    });

    // 2. Transition state INITIATED -> FUNDED_IN_ESCROW
    const event = escrow.transition('FUNDED_IN_ESCROW', dto.buyerId);

    // 3. Persist with optimistic locking
    await this.escrowRepository.save(escrow);

    // 4. Log audit event
    await this.auditLogger.log({
      entity: 'escrow_transaction',
      entityId: escrow.id,
      action: `STATE_CHANGE:${event.fromState}→${event.toState}`,
      actorId: dto.buyerId,
      metadata: {
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        sellerId: escrow.sellerId,
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
