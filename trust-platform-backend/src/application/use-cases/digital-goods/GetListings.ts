import type {
  IDigitalGoodsListingRepository,
  ListingFilter,
} from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { ListingDTO } from '../../dtos/digitalGoods.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve listings matching filters and pagination.
 */
export class GetListings {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
  ) {}

  async execute(filter?: ListingFilter): Promise<ListingDTO[]> {
    const listings = await this.listingRepository.findAll(filter);

    return listings.map((l) => ({
      id: l.id,
      sellerId: l.sellerId,
      title: l.title,
      description: l.description,
      price: l.price,
      category: l.category,
      status: l.status,
      verificationReport: l.verificationReport,
      insuranceOpted: l.insuranceOpted,
      escrowTransactionId: l.escrowTransactionId,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  }
}

/**
 * Use case: Retrieve a specific digital goods listing by ID.
 */
export class GetListingById {
  constructor(
    private readonly listingRepository: IDigitalGoodsListingRepository,
  ) {}

  async execute(id: string): Promise<ListingDTO> {
    const l = await this.listingRepository.findById(id);
    if (!l) {
      throw new NotFoundError('DigitalGoodsListing', id);
    }

    return {
      id: l.id,
      sellerId: l.sellerId,
      title: l.title,
      description: l.description,
      price: l.price,
      category: l.category,
      status: l.status,
      verificationReport: l.verificationReport,
      insuranceOpted: l.insuranceOpted,
      escrowTransactionId: l.escrowTransactionId,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    };
  }
}
