import type { IDigitalGoodsListingRepository } from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { TransitionEscrowState } from '../escrow/TransitionEscrowState.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { SubmitDeliveryDTO } from '../../dtos/digitalGoods.dto.js';
import type { EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Seller submits digital asset delivery (credentials, license key, or download link).
 * Advances escrow: FUNDED_IN_ESCROW → DELIVERED → INSPECTION_PERIOD (starts 48h timer).
 */
export class SubmitDelivery {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
    private readonly transitionEscrowState: TransitionEscrowState,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Submits asset delivery and initiates buyer's 48-hour inspection period.
   *
   * @param dto - Delivery content from seller
   * @returns Updated EscrowDetailsDTO in INSPECTION_PERIOD status
   */
  async execute(dto: SubmitDeliveryDTO): Promise<EscrowDetailsDTO> {
    if (!dto.credentialsOrPayload?.trim()) {
      throw new ValidationError('Delivery payload or credentials cannot be empty');
    }

    const listing = await this.listingRepository.findById(dto.listingId);
    if (!listing) {
      throw new NotFoundError('DigitalGoodsListing', dto.listingId);
    }

    if (listing.sellerId !== dto.sellerId) {
      throw new ForbiddenError('Only the seller can submit delivery for this listing');
    }

    if (!listing.escrowTransactionId) {
      throw new ValidationError('Listing does not have an active escrow transaction');
    }

    // 1. Advance to DELIVERED
    await this.transitionEscrowState.execute({
      escrowTransactionId: listing.escrowTransactionId,
      targetState: 'DELIVERED',
      actorId: dto.sellerId,
    });

    // 2. Advance to INSPECTION_PERIOD (automatically schedules 48h auto-release job)
    const inspectionEscrow = await this.transitionEscrowState.execute({
      escrowTransactionId: listing.escrowTransactionId,
      targetState: 'INSPECTION_PERIOD',
      actorId: dto.sellerId,
    });

    // 3. Log delivery audit event
    await this.auditLogger.log({
      entity: 'digital_goods_listing',
      entityId: listing.id,
      action: 'DELIVERY_SUBMITTED',
      actorId: dto.sellerId,
      metadata: {
        escrowTransactionId: listing.escrowTransactionId,
        instructions: dto.instructions ?? null,
      },
    });

    return inspectionEscrow;
  }
}
