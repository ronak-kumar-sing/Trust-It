import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApproveDelivery } from '../../../../src/application/use-cases/digital-goods/ApproveDelivery.js';
import type { IDigitalGoodsListingRepository } from '../../../../src/application/interfaces/IDigitalGoodsListingRepository.js';
import type { TransitionEscrowState } from '../../../../src/application/use-cases/escrow/TransitionEscrowState.js';
import { DigitalGoodsListing } from '../../../../src/domain/entities/DigitalGoodsListing.js';

describe('ApproveDelivery Use Case', () => {
  let listingRepo: IDigitalGoodsListingRepository;
  let transitionEscrowState: TransitionEscrowState;
  let useCase: ApproveDelivery;

  const sellerId = 'seller-appr-1';
  const buyerId = 'buyer-appr-1';
  const listingId = 'listing-appr-1';
  const escrowId = 'escrow-appr-1';

  beforeEach(() => {
    listingRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    transitionEscrowState = {
      execute: vi.fn().mockResolvedValue({
        id: escrowId,
        status: 'RELEASED',
      } as any),
    } as any;
    useCase = new ApproveDelivery(listingRepo, transitionEscrowState);
  });

  it('triggers escrow transition to RELEASED', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'Domain Name ai-agent.dev',
      price: 500000,
    });
    listing.markSold(escrowId);
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    const result = await useCase.execute(listingId, buyerId);

    expect(result.status).toBe('RELEASED');
    expect(transitionEscrowState.execute).toHaveBeenCalledWith({
      escrowTransactionId: escrowId,
      targetState: 'RELEASED',
      actorId: buyerId,
    });
  });
});
