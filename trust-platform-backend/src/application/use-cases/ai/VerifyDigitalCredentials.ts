import type {
  ICredentialVerifier,
  CredentialVerificationResult,
} from '../../interfaces/ICredentialVerifier.js';
import type { IDigitalGoodsListingRepository } from '../../interfaces/IDigitalGoodsListingRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';

export interface VerifyDigitalCredentialsDTO {
  listingId?: string;
  category: string;
  payload: string | Record<string, unknown>;
  actorId: string;
}

/**
 * Use case: AI-powered verification of digital goods credentials.
 */
export class VerifyDigitalCredentials {
  constructor(
    private readonly credentialVerifier: ICredentialVerifier,
    private readonly auditLogger: IAuditLogger,
    private readonly listingRepository?: IDigitalGoodsListingRepository,
  ) {}

  async execute(dto: VerifyDigitalCredentialsDTO): Promise<CredentialVerificationResult> {
    const result = await this.credentialVerifier.verifyCredentials({
      category: dto.category,
      payload: dto.payload,
    });

    if (dto.listingId && this.listingRepository) {
      const listing = await this.listingRepository.findById(dto.listingId);
      if (listing) {
        listing.attachVerificationReport({
          isValid: result.isValid,
          confidence: result.confidence,
          accountType: result.accountType,
          verifiedAt: new Date().toISOString(),
          riskScore: result.details.riskScore,
        });
        await this.listingRepository.update(listing);
      }
    }

    await this.auditLogger.log({
      entity: 'digital_credentials',
      entityId: dto.listingId ?? 'ad_hoc_check',
      action: 'CREDENTIALS_VERIFIED',
      actorId: dto.actorId,
      metadata: {
        category: dto.category,
        isValid: result.isValid,
        confidence: result.confidence,
        riskScore: result.details.riskScore,
      },
    });

    return result;
  }
}
