import { describe, it, expect } from 'vitest';
import { DigitalGoodsListing } from '../../../src/domain/entities/DigitalGoodsListing.js';
import {
  InvalidAmountError,
  ValidationError,
  IllegalStateTransitionError,
} from '../../../src/shared/errors/index.js';

describe('DigitalGoodsListing Domain Entity', () => {
  const sellerId = 'seller-123';

  it('creates an active digital goods listing with valid fields', () => {
    const listing = DigitalGoodsListing.create({
      sellerId,
      title: 'CS:GO Dragon Lore AWP Account',
      description: 'Prime verified, 2500 hours, clean VAC history',
      price: 1500000, // ₹15,000.00
      category: 'GAMING_ACCOUNT',
      insuranceOpted: true,
    });

    expect(listing.id).toBeDefined();
    expect(listing.sellerId).toBe(sellerId);
    expect(listing.title).toBe('CS:GO Dragon Lore AWP Account');
    expect(listing.price).toBe(1500000);
    expect(listing.category).toBe('GAMING_ACCOUNT');
    expect(listing.status).toBe('ACTIVE');
    expect(listing.insuranceOpted).toBe(true);
    expect(listing.escrowTransactionId).toBeNull();
  });

  it('throws ValidationError when title is too short or too long', () => {
    expect(() =>
      DigitalGoodsListing.create({
        sellerId,
        title: 'ab',
        price: 5000,
      }),
    ).toThrow(ValidationError);

    expect(() =>
      DigitalGoodsListing.create({
        sellerId,
        title: 'a'.repeat(201),
        price: 5000,
      }),
    ).toThrow(ValidationError);
  });

  it('throws InvalidAmountError when price is not positive integer', () => {
    expect(() =>
      DigitalGoodsListing.create({
        sellerId,
        title: 'Valid Title',
        price: 0,
      }),
    ).toThrow(InvalidAmountError);
  });

  it('transitions ACTIVE -> SOLD when markSold is called', () => {
    const listing = DigitalGoodsListing.create({
      sellerId,
      title: 'OpenAI API Credits Account',
      price: 20000,
    });

    listing.markSold('escrow-abc');
    expect(listing.status).toBe('SOLD');
    expect(listing.escrowTransactionId).toBe('escrow-abc');
  });

  it('throws IllegalStateTransitionError if trying to mark an already SOLD listing as SOLD', () => {
    const listing = DigitalGoodsListing.create({
      sellerId,
      title: 'Instagram Handle @techhub',
      price: 50000,
    });

    listing.markSold('escrow-abc');
    expect(() => listing.markSold('escrow-def')).toThrow(IllegalStateTransitionError);
  });

  it('allows updates to title, price, and description when ACTIVE', () => {
    const listing = DigitalGoodsListing.create({
      sellerId,
      title: 'Original Title',
      price: 10000,
    });

    listing.updateDetails({
      title: 'Updated Title',
      price: 12000,
      description: 'Added detailed delivery terms',
    });

    expect(listing.title).toBe('Updated Title');
    expect(listing.price).toBe(12000);
    expect(listing.description).toBe('Added detailed delivery terms');
  });
});
