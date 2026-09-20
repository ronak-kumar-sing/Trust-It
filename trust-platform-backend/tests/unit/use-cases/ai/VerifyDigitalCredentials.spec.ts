import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerifyDigitalCredentials } from '../../../../src/application/use-cases/ai/VerifyDigitalCredentials.js';
import { DigitalGoodsListing } from '../../../../src/domain/entities/DigitalGoodsListing.js';
import type {
  ICredentialVerifier,
  IDigitalGoodsListingRepository,
  IAuditLogger,
} from '../../../../src/application/interfaces/index.js';

describe('VerifyDigitalCredentials Use Case', () => {
  let verifier: ICredentialVerifier;
  let listingRepo: IDigitalGoodsListingRepository;
  let auditLogger: IAuditLogger;
  let useCase: VerifyDigitalCredentials;
  let testListing: DigitalGoodsListing;

  beforeEach(() => {
    testListing = DigitalGoodsListing.create({
      id: 'list_cred_1',
      sellerId: 'usr_seller_1',
      title: 'Valid Netflix Account',
      price: 150000,
      category: 'STREAMING_ACCOUNT',
    });

    verifier = {
      verifyCredentials: vi.fn(async () => ({
        isValid: true,
        confidence: 0.98,
        accountType: 'STREAMING_ACCOUNT',
        details: {
          formatValid: true,
          riskScore: 2,
          checksPerformed: ['FORMAT_PARSING'],
          notes: 'Clean credentials',
        },
      })),
    };

    listingRepo = {
      findById: vi.fn(async (id: string) => (id === testListing.id ? testListing : null)),
      findAll: vi.fn(async () => [testListing]),
      create: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };

    auditLogger = {
      log: vi.fn(async () => {}),
    };

    useCase = new VerifyDigitalCredentials(verifier, auditLogger, listingRepo);
  });

  it('verifies credentials and attaches report to listing if listingId provided', async () => {
    const result = await useCase.execute({
      listingId: testListing.id,
      category: 'STREAMING_ACCOUNT',
      payload: 'valid:pass123',
      actorId: 'usr_seller_1',
    });

    expect(result.isValid).toBe(true);
    expect(result.confidence).toBe(0.98);
    expect(testListing.verificationReport).toBeDefined();
    expect(testListing.verificationReport?.isValid).toBe(true);
    expect(listingRepo.update).toHaveBeenCalledWith(testListing);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'digital_credentials',
        action: 'CREDENTIALS_VERIFIED',
      }),
    );
  });

  it('performs standalone credential verification without listingId', async () => {
    const result = await useCase.execute({
      category: 'API_KEY',
      payload: 'sk_live_1234567890',
      actorId: 'usr_buyer_1',
    });

    expect(result.isValid).toBe(true);
    expect(listingRepo.update).not.toHaveBeenCalled();
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'ad_hoc_check',
      }),
    );
  });
});
