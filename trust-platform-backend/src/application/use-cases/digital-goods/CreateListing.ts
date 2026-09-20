import { DigitalGoodsListing } from '../../../domain/entities/DigitalGoodsListing.js';
import type { IDigitalGoodsListingRepository } from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { CreateListingDTO, ListingDTO } from '../../dtos/digitalGoods.dto.js';

/**
 * Use case: Create a new digital goods listing.
 */
export class CreateListing {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Creates and publishes a digital goods listing.
   *
   * @param dto - Listing creation details
   * @returns Created ListingDTO
   */
  async execute(dto: CreateListingDTO): Promise<ListingDTO> {
    const listing = DigitalGoodsListing.create({
      sellerId: dto.sellerId,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      category: dto.category,
      insuranceOpted: dto.insuranceOpted,
    });

    await this.listingRepository.create(listing);

    await this.auditLogger.log({
      entity: 'digital_goods_listing',
      entityId: listing.id,
      action: 'LISTING_CREATED',
      actorId: dto.sellerId,
      metadata: {
        title: listing.title,
        price: listing.price,
        category: listing.category,
      },
    });

    return {
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      status: listing.status,
      verificationReport: listing.verificationReport,
      insuranceOpted: listing.insuranceOpted,
      escrowTransactionId: listing.escrowTransactionId,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }
}
