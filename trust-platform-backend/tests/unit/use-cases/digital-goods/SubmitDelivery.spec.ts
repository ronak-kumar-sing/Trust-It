import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitDelivery } from '../../../../src/application/use-cases/digital-goods/SubmitDelivery.js';
import type { IDigitalGoodsListingRepository } from '../../../../src/application/interfaces/IDigitalGoodsListingRepository.js';
import type { TransitionEscrowState } from '../../../../src/application/use-cases/escrow/TransitionEscrowState.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { DigitalGoodsListing } from '../../../../src/domain/entities/DigitalGoodsListing.js';
import { ForbiddenError, ValidationError } from '../../../../src/shared/errors/index.js';

describe('SubmitDelivery Use Case', () => {
  let listingRepo: IDigitalGoodsListingRepository;
  let transitionEscrowState: TransitionEscrowState;
  let auditLogger: IAuditLogger;
  let useCase: SubmitDelivery;

  const sellerId = 'seller-dlv-1';
  const listingId = 'listing-dlv-100';
  const escrowId = 'escrow-dlv-200';

  beforeEach(() => {
    listingRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    transitionEscrowState = {
      execute: vi.fn().mockImplementation((dto) =>
        Promise.resolve({
          id: dto.escrowTransactionId,
          status: dto.targetState,
        } as any),
      ),
    } as any;
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new SubmitDelivery(
      listingRepo,
      transitionEscrowState,
      auditLogger,
    );
  });

  it('advances escrow to DELIVERED then INSPECTION_PERIOD upon valid credentials submission', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'Twitter Handle @cryptoking',
      price: 200000,
    });
    listing.markSold(escrowId);
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    const result = await useCase.execute({
      listingId,
      sellerId,
      credentialsOrPayload: 'user: pass123 | recovery email: recovery@mail.com',
      instructions: 'Please change password within 48 hours.',
    });

    expect(result.status).toBe('INSPECTION_PERIOD');
    expect(transitionEscrowState.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowTransactionId: escrowId,
        targetState: 'DELIVERED',
        actorId: sellerId,
      }),
    );
    expect(transitionEscrowState.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowTransactionId: escrowId,
        targetState: 'INSPECTION_PERIOD',
        actorId: sellerId,
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELIVERY_SUBMITTED',
      }),
    );
  });

  it('throws ForbiddenError if someone other than the seller submits delivery', async () => {
    const listing = DigitalGoodsListing.create({
      id: listingId,
      sellerId,
      title: 'Item',
      price: 50000,
    });
    listing.markSold(escrowId);
    vi.mocked(listingRepo.findById).mockResolvedValue(listing);

    await expect(
      useCase.execute({
        listingId,
        sellerId: 'imposter-id',
        credentialsOrPayload: 'credentials',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ValidationError if payload is empty', async () => {
    await expect(
      useCase.execute({
        listingId,
        sellerId,
        credentialsOrPayload: '   ',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
