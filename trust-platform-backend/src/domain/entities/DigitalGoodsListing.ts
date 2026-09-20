import type {
  ListingCategoryType,
  ListingStatusType,
} from '../enums/ListingStatus.js';
import {
  InvalidAmountError,
  ValidationError,
  IllegalStateTransitionError,
} from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * DigitalGoodsListing domain entity.
 * Represents verified digital assets for sale: gaming accounts, API keys,
 * handles, and software licenses.
 */
export class DigitalGoodsListing {
  private constructor(
    public readonly id: string,
    public readonly sellerId: string,
    private _title: string,
    private _description: string,
    private _price: number,
    private _category: ListingCategoryType,
    private _status: ListingStatusType,
    private _verificationReport: Record<string, unknown> | null,
    private _insuranceOpted: boolean,
    private _escrowTransactionId: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get price(): number {
    return this._price;
  }

  get category(): ListingCategoryType {
    return this._category;
  }

  get status(): ListingStatusType {
    return this._status;
  }

  get verificationReport(): Record<string, unknown> | null {
    return this._verificationReport ? { ...this._verificationReport } : null;
  }

  get insuranceOpted(): boolean {
    return this._insuranceOpted;
  }

  get escrowTransactionId(): string | null {
    return this._escrowTransactionId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  /**
   * Creates a new listing instance.
   */
  static create(params: {
    id?: string;
    sellerId: string;
    title: string;
    description?: string;
    price: number;
    category?: ListingCategoryType;
    status?: ListingStatusType;
    insuranceOpted?: boolean;
  }): DigitalGoodsListing {
    const trimmedTitle = params.title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      throw new ValidationError('Listing title must be between 3 and 200 characters');
    }
    if (!Number.isInteger(params.price) || params.price <= 0) {
      throw new InvalidAmountError(params.price);
    }

    return new DigitalGoodsListing(
      params.id ?? nanoid(),
      params.sellerId,
      trimmedTitle,
      params.description?.trim() ?? '',
      params.price,
      params.category ?? 'OTHER',
      params.status ?? 'ACTIVE',
      null,
      params.insuranceOpted ?? false,
      null,
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitutes listing from database persistence row.
   */
  static fromPersistence(props: {
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
  }): DigitalGoodsListing {
    return new DigitalGoodsListing(
      props.id,
      props.seller_id,
      props.title,
      props.description,
      Number(props.price),
      props.category,
      props.status,
      props.verification_report,
      props.insurance_opted,
      props.escrow_transaction_id,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── Mutations ────────────────────────────────────────────────

  /**
   * Updates basic listing details. Only allowed when listing is not SOLD or CANCELLED.
   */
  updateDetails(updates: {
    title?: string;
    description?: string;
    price?: number;
    category?: ListingCategoryType;
    insuranceOpted?: boolean;
  }): void {
    if (this._status === 'SOLD' || this._status === 'CANCELLED') {
      throw new ValidationError(`Cannot update a listing in ${this._status} status`);
    }

    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (trimmed.length < 3 || trimmed.length > 200) {
        throw new ValidationError('Title must be between 3 and 200 characters');
      }
      this._title = trimmed;
    }

    if (updates.description !== undefined) {
      this._description = updates.description.trim();
    }

    if (updates.price !== undefined) {
      if (!Number.isInteger(updates.price) || updates.price <= 0) {
        throw new InvalidAmountError(updates.price);
      }
      this._price = updates.price;
    }

    if (updates.category !== undefined) {
      this._category = updates.category;
    }

    if (updates.insuranceOpted !== undefined) {
      this._insuranceOpted = updates.insuranceOpted;
    }

    this._updatedAt = new Date();
  }

  /**
   * Marks listing as SOLD and associates it with the initiated escrow transaction.
   */
  markSold(escrowTransactionId: string): void {
    if (this._status !== 'ACTIVE') {
      throw new IllegalStateTransitionError(this._status, 'SOLD');
    }
    this._status = 'SOLD';
    this._escrowTransactionId = escrowTransactionId;
    this._updatedAt = new Date();
  }

  /**
   * Suspends listing from marketplace display.
   */
  suspend(): void {
    if (this._status !== 'ACTIVE') {
      throw new IllegalStateTransitionError(this._status, 'SUSPENDED');
    }
    this._status = 'SUSPENDED';
    this._updatedAt = new Date();
  }

  /**
   * Cancels listing permanently.
   */
  cancel(): void {
    if (this._status === 'SOLD') {
      throw new IllegalStateTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
    this._updatedAt = new Date();
  }

  /**
   * Attaches AI credential or asset verification report.
   */
  attachVerificationReport(report: Record<string, unknown>): void {
    this._verificationReport = { ...report };
    this._updatedAt = new Date();
  }

  /**
   * Serializes entity to database row format.
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      seller_id: this.sellerId,
      title: this._title,
      description: this._description,
      price: this._price,
      category: this._category,
      status: this._status,
      verification_report: this._verificationReport,
      insurance_opted: this._insuranceOpted,
      escrow_transaction_id: this._escrowTransactionId,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
