import type { IDigitalGoodsListingRepository } from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { CreateEscrow } from '../escrow/CreateEscrow.js';
import type { FundEscrow } from '../escrow/FundEscrow.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { BuyListingDTO, BuyListingResultDTO } from '../../dtos/digitalGoods.dto.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Purchase a digital goods listing.
 * Creates an escrow transaction, locks buyer funds into escrow, and marks the listing as SOLD.
 */
export class BuyListing {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
    private readonly createEscrow: CreateEscrow,
    private readonly fundEscrow: FundEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Executes the buy flow: Escrow Create → Wallet Lock / Escrow Fund → Listing Sold.
   *
   * @param dto - Listing ID and buyer ID
   * @returns Updated listing and active funded escrow transaction
   */
  async execute(dto: BuyListingDTO): Promise<BuyListingResultDTO> {
    const listing = await this.listingRepository.findById(dto.listingId);
    if (!listing) {
      throw new NotFoundError('DigitalGoodsListing', dto.listingId);
    }

    if (listing.sellerId === dto.buyerId) {
      throw new ValidationError('You cannot buy your own listing');
    }

    if (listing.status !== 'ACTIVE') {
      throw new ConflictError(
        `Listing is not available for purchase (current status: ${listing.status})`,
      );
    }

    // 1. Create Escrow contract
    const escrow = await this.createEscrow.execute({
      buyerId: dto.buyerId,
      sellerId: listing.sellerId,
      type: 'DIGITAL_GOODS',
      amount: listing.price,
      metadata: {
        listingId: listing.id,
        listingTitle: listing.title,
        category: listing.category,
      },
    });

    // 2. Fund Escrow (freezes buyer funds in wallet)
    const fundedEscrow = await this.fundEscrow.execute({
      escrowTransactionId: escrow.id,
      buyerId: dto.buyerId,
    });

    // 3. Mark listing as SOLD
    listing.markSold(fundedEscrow.id);
    await this.listingRepository.update(listing);

    // 4. Log audit event
    await this.auditLogger.log({
      entity: 'digital_goods_listing',
      entityId: listing.id,
      action: 'LISTING_PURCHASED',
      actorId: dto.buyerId,
      metadata: {
        escrowTransactionId: fundedEscrow.id,
        amount: listing.price,
        sellerId: listing.sellerId,
      },
    });

    return {
      listing: {
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
      },
      escrow: fundedEscrow,
    };
  }
}
