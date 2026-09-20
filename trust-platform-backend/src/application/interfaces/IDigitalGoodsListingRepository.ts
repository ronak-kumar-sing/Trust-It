import type { DigitalGoodsListing } from '../../domain/entities/DigitalGoodsListing.js';
import type {
  ListingCategoryType,
  ListingStatusType,
} from '../../domain/enums/ListingStatus.js';

export interface ListingFilter {
  category?: ListingCategoryType;
  status?: ListingStatusType;
  sellerId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Port interface for DigitalGoodsListing persistence.
 */
export interface IDigitalGoodsListingRepository {
  findById(id: string): Promise<DigitalGoodsListing | null>;
  findAll(filter?: ListingFilter): Promise<DigitalGoodsListing[]>;
  create(listing: DigitalGoodsListing): Promise<void>;
  update(listing: DigitalGoodsListing): Promise<void>;
}
