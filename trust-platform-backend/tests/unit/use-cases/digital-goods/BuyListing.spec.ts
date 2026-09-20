import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuyListing } from '../../../../src/application/use-cases/digital-goods/BuyListing.js';
import type { IDigitalGoodsListingRepository } from '../../../../src/application/interfaces/IDigitalGoodsListingRepository.js';
import type { CreateEscrow } from '../../../../src/application/use-cases/escrow/CreateEscrow.js';
import type { FundEscrow } from '../../../../src/application/use-cases/escrow/FundEscrow.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { DigitalGoodsListing } from '../../../../src/domain/entities/DigitalGoodsListing.js';
import { ValidationError, ConflictError } from '../../../../src/shared/errors/index.js';

describe('BuyListing Use Case', () => {
  let listingRepo: IDigitalGoodsListingRepository;
  let createEscrow: CreateEscrow;
  let fundEscrow: FundEscrow;
  let auditLogger: IAuditLogger;
  let useCase: BuyListing;

  const sellerId = 'seller-buy-1';
  const buyerId = 'buyer-buy-1';
  const listingId = 'listing-123';

  beforeEach(() => {
    listingRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    };
    createEscrow = {
      execute: vi.fn().mockResolvedValue({
        id: 'escrow-gen-1',
        type: 'DIGITAL_GOODS',
        buyerId,
        sellerId,
        amount: 80000,
        platformFee: 4000,
        status: 'INITIATED',
      } as any),
    } as any;
    fundEscrow = {
      execute: vi.fn().mockResolvedValue({
        id: 'escrow-gen-1',
        type: 'DIGITAL_GOODS',
        buyerId,
        sellerId,
        amount: 80000,
        platformFee: 4000,
        status: 'FUNDED_IN_ESCROW',
      } as any),
    } as any;
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new BuyListing(
      listingRepo,
      createEscrow,
      fundEscrow,
      auditLogger,
    );
  });

  it('orchestrates escrow creation, funding, and marks listing SOLD', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'Premium Figma Organization License',
      price: 80000,
    });
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    const result = await useCase.execute({
      listingId,
      buyerId,
    });

    expect(result.listing.status).toBe('SOLD');
    expect(result.listing.escrowTransactionId).toBe('escrow-gen-1');
    expect(result.escrow.status).toBe('FUNDED_IN_ESCROW');
    expect(createEscrow.execute).toHaveBeenCalledTimes(1);
    expect(fundEscrow.execute).toHaveBeenCalledTimes(1);
    expect(listingRepo.update).toHaveBeenCalledWith(listing);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LISTING_PURCHASED',
      }),
    );
  });

  it('throws ValidationError if buyer attempts to purchase own listing', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'My Listing',
      price: 50000,
    });
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    await expect(
      useCase.execute({
        listingId,
        buyerId: sellerId, // same user
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ConflictError if listing is already SOLD', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'Sold Listing',
      price: 50000,
    });
    listing.markSold('prev-escrow');
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    await expect(
      useCase.execute({
        listingId,
        buyerId,
      }),
    ).rejects.toThrow(ConflictError);
  });
});
