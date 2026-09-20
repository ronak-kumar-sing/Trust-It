import type { IDigitalGoodsListingRepository } from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { TransitionEscrowState } from '../escrow/TransitionEscrowState.js';
import type { EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

/**
 * Use case: Buyer approves delivered digital goods during inspection window.
 * Releases funds from escrow to seller wallet minus platform fee.
 */
export class ApproveDelivery {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
    private readonly transitionEscrowState: TransitionEscrowState,
  ) {}

  /**
   * Approves delivery and completes transaction.
   *
   * @param listingId - Target listing UUID
   * @param buyerId - Authenticated buyer UUID
   */
  async execute(listingId: string, buyerId: string): Promise<EscrowDetailsDTO> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('DigitalGoodsListing', listingId);
    }

    if (!listing.escrowTransactionId) {
      throw new ValidationError('Listing does not have an active escrow transaction');
    }

    return this.transitionEscrowState.execute({
      escrowTransactionId: listing.escrowTransactionId,
      targetState: 'RELEASED',
      actorId: buyerId,
    });
  }
}
