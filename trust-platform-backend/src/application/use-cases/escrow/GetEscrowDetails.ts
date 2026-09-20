import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve details for a specific escrow transaction.
 */
export class GetEscrowDetails {
  constructor(private readonly escrowRepository: IEscrowRepository) {}

  /**
   * Retrieves escrow contract details by UUID.
   *
   * @param id - Escrow transaction UUID
   * @returns EscrowDetailsDTO
   * @throws {NotFoundError} If escrow not found
   */
  async execute(id: string): Promise<EscrowDetailsDTO> {
    const escrow = await this.escrowRepository.findById(id);
    if (!escrow) {
      throw new NotFoundError('EscrowTransaction', id);
    }

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
