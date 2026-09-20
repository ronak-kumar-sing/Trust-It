import type {
  ListingCategoryType,
  ListingStatusType,
} from '../../domain/enums/ListingStatus.js';
import type { EscrowDetailsDTO } from './escrow.dto.js';

export interface CreateListingDTO {
  sellerId: string;
  title: string;
  description?: string;
  price: number;
  category?: ListingCategoryType;
  insuranceOpted?: boolean;
}

export interface UpdateListingDTO {
  id: string;
  sellerId: string;
  title?: string;
  description?: string;
  price?: number;
  category?: ListingCategoryType;
  insuranceOpted?: boolean;
}

export interface BuyListingDTO {
  listingId: string;
  buyerId: string;
}

export interface SubmitDeliveryDTO {
  listingId: string;
  sellerId: string;
  credentialsOrPayload: string;
  instructions?: string;
}

export interface ListingDTO {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategoryType;
  status: ListingStatusType;
  verificationReport: Record<string, unknown> | null;
  insuranceOpted: boolean;
  escrowTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyListingResultDTO {
  listing: ListingDTO;
  escrow: EscrowDetailsDTO;
}
