import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IDigitalGoodsListingRepository,
  ListingFilter,
} from '../../application/interfaces/IDigitalGoodsListingRepository.js';
import { DigitalGoodsListing } from '../../domain/entities/DigitalGoodsListing.js';
import { DatabaseError } from '../../shared/errors/index.js';
import type {
  ListingCategoryType,
  ListingStatusType,
} from '../../domain/enums/ListingStatus.js';

interface ListingRow {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number | string;
  category: ListingCategoryType;
  status: ListingStatusType;
  verification_report: Record<string, unknown> | null;
  insurance_opted: boolean;
  escrow_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IDigitalGoodsListingRepository.
 */
export class SupabaseDigitalGoodsListingRepository
  implements IDigitalGoodsListingRepository
{
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Finds a listing by its UUID.
   */
  async findById(id: string): Promise<DigitalGoodsListing | null> {
    const { data, error } = await this.client
      .from('digital_goods_listings')
      .select('*')
      .eq('id', id)
      .maybeSingle<ListingRow>();

    if (error) {
      throw new DatabaseError('findById listing', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Retrieves listings with optional filters and pagination.
   */
  async findAll(filter?: ListingFilter): Promise<DigitalGoodsListing[]> {
    let query = this.client.from('digital_goods_listings').select('*');

    if (filter?.category) {
      query = query.eq('category', filter.category);
    }
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.sellerId) {
      query = query.eq('seller_id', filter.sellerId);
    }

    const limit = filter?.limit ?? 50;
    const offset = filter?.offset ?? 0;

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError('findAll listings', error.message);
    }

    if (!data) return [];
    return data.map((row: ListingRow) => this.toDomain(row));
  }

  /**
   * Persists a new listing record.
   */
  async create(listing: DigitalGoodsListing): Promise<void> {
    const payload = listing.toPersistence();
    const { error } = await this.client
      .from('digital_goods_listings')
      .insert(payload);

    if (error) {
      throw new DatabaseError('create listing', error.message);
    }
  }

  /**
   * Updates an existing listing record.
   */
  async update(listing: DigitalGoodsListing): Promise<void> {
    const payload = listing.toPersistence();
    const { error } = await this.client
      .from('digital_goods_listings')
      .update(payload)
      .eq('id', listing.id);

    if (error) {
      throw new DatabaseError('update listing', error.message);
    }
  }

  private toDomain(row: ListingRow): DigitalGoodsListing {
    return DigitalGoodsListing.fromPersistence({
      id: row.id,
      seller_id: row.seller_id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      status: row.status,
      verification_report: row.verification_report,
      insurance_opted: row.insurance_opted,
      escrow_transaction_id: row.escrow_transaction_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
