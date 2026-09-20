/**
 * Domain types for Digital Goods and Core Escrow Transactions.
 */

export type EscrowStatus =
  | 'INITIATED'
  | 'FUNDED_IN_ESCROW'
  | 'DELIVERED'
  | 'INSPECTION_PERIOD'
  | 'DISPUTED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'CANCELLED';

export type ListingCategory = 'SOCIAL_ACCOUNT' | 'DOMAIN_HANDLE' | 'API_KEY' | 'GAMING_ASSET';

export interface DigitalGoodsListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerScore: number;
  sellerTier: 'BRONZE' | 'SILVER' | 'GOLD';
  title: string;
  description: string;
  category: ListingCategory;
  price: number;
  isPreVerified: boolean;
  status: 'ACTIVE' | 'LOCKED' | 'SOLD';
  createdAt: string;
}

export interface EscrowTransaction {
  id: string;
  listingId?: string;
  title: string;
  category: 'DIGITAL_GOODS' | 'FREELANCE' | 'GAMING';
  buyerId: string;
  sellerId: string;
  counterpartyName: string;
  amount: number;
  fee: number;
  status: EscrowStatus;
  inspectionHoursRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeRecord {
  id: string;
  escrowId: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: 'PENDING' | 'AI_REVIEW' | 'COMMUNITY_VOTE' | 'RESOLVED';
  createdAt: string;
}
