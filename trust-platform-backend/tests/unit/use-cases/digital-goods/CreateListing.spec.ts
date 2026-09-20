import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateListing } from '../../../../src/application/use-cases/digital-goods/CreateListing.js';
import type { IDigitalGoodsListingRepository } from '../../../../src/application/interfaces/IDigitalGoodsListingRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';

describe('CreateListing Use Case', () => {
  let listingRepo: IDigitalGoodsListingRepository;
  let auditLogger: IAuditLogger;
  let useCase: CreateListing;

  const sellerId = 'seller-dg-1';

  beforeEach(() => {
    listingRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new CreateListing(listingRepo, auditLogger);
  });

  it('creates and persists a listing successfully', async () => {
    const result = await useCase.execute({
      sellerId,
      title: 'Rare Steam Account with 50+ Games',
      description: 'Clean account, original email included',
      price: 250000, // ₹2,500
      category: 'GAMING_ACCOUNT',
      insuranceOpted: false,
    });

    expect(result.id).toBeDefined();
    expect(result.sellerId).toBe(sellerId);
    expect(result.title).toBe('Rare Steam Account with 50+ Games');
    expect(result.price).toBe(250000);
    expect(result.status).toBe('ACTIVE');

    expect(listingRepo.create).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'digital_goods_listing',
        action: 'LISTING_CREATED',
      }),
    );
  });
});
