import { apiClient, generateIdempotencyKey } from '../api/client';
import { DigitalGoodsListing, EscrowTransaction, DisputeRecord, ListingCategory } from '../types';
import { MOCK_LISTINGS, MOCK_ESCROWS } from '../api/mockData';

export const escrowService = {
  /**
   * Fetch digital goods listings with optional category and search query filters.
   */
  async getListings(category?: ListingCategory, search?: string): Promise<DigitalGoodsListing[]> {
    try {
      const res = await apiClient.axios.get('/digital-goods/listings', {
        params: { category, search },
      });
      return res.data;
    } catch {
      let filtered = [...MOCK_LISTINGS];
      if (category) {
        filtered = filtered.filter((item) => item.category === category);
      }
      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  /**
   * Get listing by unique identifier.
   */
  async getListingById(id: string): Promise<DigitalGoodsListing> {
    try {
      const res = await apiClient.axios.get(`/digital-goods/listings/${id}`);
      return res.data;
    } catch {
      const found = MOCK_LISTINGS.find((l) => l.id === id);
      if (!found) throw new Error('Listing not found');
      return found;
    }
  },

  /**
   * Create a new digital goods listing.
   */
  async createListing(data: {
    title: string;
    description: string;
    category: ListingCategory;
    price: number;
    credentialPayload: string;
  }): Promise<DigitalGoodsListing> {
    try {
      const res = await apiClient.axios.post('/digital-goods/listings', data, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('list') },
      });
      return res.data;
    } catch {
      const newListing: DigitalGoodsListing = {
        id: `list_dg_${Date.now()}`,
        sellerId: 'usr_mock_001',
        sellerName: 'Alex Trader',
        sellerScore: 845,
        sellerTier: 'GOLD',
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        isPreVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      MOCK_LISTINGS.unshift(newListing);
      return newListing;
    }
  },

  /**
   * Fund an escrow transaction for a listing.
   */
  async fundEscrow(listingId: string, amount: number): Promise<EscrowTransaction> {
    try {
      const res = await apiClient.axios.post(
        `/digital-goods/listings/${listingId}/buy`,
        { amount },
        { headers: { 'Idempotency-Key': generateIdempotencyKey('fund') } }
      );
      return res.data;
    } catch {
      const newEscrow: EscrowTransaction = {
        id: `esc_dg_${Date.now()}`,
        listingId,
        title: 'Digital Goods Escrow Lock',
        category: 'DIGITAL_GOODS',
        buyerId: 'usr_mock_001',
        sellerId: 'usr_seller_009',
        counterpartyName: 'DevPrime',
        amount,
        fee: Math.round(amount * 0.01),
        status: 'FUNDED_IN_ESCROW',
        inspectionHoursRemaining: 24,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_ESCROWS.unshift(newEscrow);
      return newEscrow;
    }
  },

  /**
   * Get transaction details by escrow ID.
   */
  async getEscrowById(escrowId: string): Promise<EscrowTransaction> {
    try {
      const res = await apiClient.axios.get(`/escrow/${escrowId}`);
      return res.data;
    } catch {
      const found = MOCK_ESCROWS.find((e) => e.id === escrowId);
      return found ?? MOCK_ESCROWS[0];
    }
  },

  /**
   * Approve inspection and release funds to seller.
   */
  async approveRelease(escrowId: string): Promise<void> {
    try {
      await apiClient.axios.post(
        `/escrow/${escrowId}/release`,
        {},
        { headers: { 'Idempotency-Key': generateIdempotencyKey('rel') } }
      );
    } catch {
      const found = MOCK_ESCROWS.find((e) => e.id === escrowId);
      if (found) found.status = 'RELEASED';
    }
  },

  /**
   * File dispute for an escrow transaction.
   */
  async fileDispute(escrowId: string, reason: string, description: string): Promise<DisputeRecord> {
    try {
      const res = await apiClient.axios.post(
        `/escrow/${escrowId}/dispute`,
        { reason, description },
        { headers: { 'Idempotency-Key': generateIdempotencyKey('disp') } }
      );
      return res.data;
    } catch {
      const found = MOCK_ESCROWS.find((e) => e.id === escrowId);
      if (found) found.status = 'DISPUTED';
      return {
        id: `disp_${Date.now()}`,
        escrowId,
        reason,
        description,
        evidenceUrls: ['https://trustvault.io/evidence/mock.png'],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
    }
  },
};
