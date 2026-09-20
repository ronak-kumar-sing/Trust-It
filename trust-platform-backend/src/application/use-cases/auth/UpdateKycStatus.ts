import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { UpdateKycStatusDTO, UserProfileDTO } from '../../dtos/auth.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { TRUST_SCORE_ADJUSTMENTS } from '../../../shared/constants/index.js';

/**
 * Use case: Transition a user's KYC verification status.
 * Enforces legal state transitions, awards trust score bonus upon verification,
 * and emits an audit event.
 */
export class UpdateKycStatus {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Executes KYC status transition.
   *
   * @param dto - Target status, user ID, actor ID, and optional reason
   * @returns Updated user profile representation
   * @throws {NotFoundError} When user does not exist
   * @throws {IllegalStateTransitionError} When state transition is illegal
   */
  async execute(dto: UpdateKycStatusDTO): Promise<UserProfileDTO> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User', dto.userId);
    }

    const previousStatus = user.kycStatus;
    user.transitionKycStatus(dto.targetStatus);

    // If successfully verified, boost trust score by KYC_VERIFIED constant (+15)
    if (dto.targetStatus === 'VERIFIED') {
      user.updateTrustScore(user.trustScore + TRUST_SCORE_ADJUSTMENTS.KYC_VERIFIED);
    }

    await this.userRepository.update(user);

    await this.auditLogger.log({
      entity: 'user',
      entityId: user.id,
      action: `KYC_TRANSITION:${previousStatus}→${dto.targetStatus}`,
      actorId: dto.actorId,
      metadata: {
        previousStatus,
        newStatus: dto.targetStatus,
        reason: dto.reason ?? null,
        newTrustScore: user.trustScore,
      },
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      kycStatus: user.kycStatus,
      isKycVerified: user.isKycVerified,
      trustScore: user.trustScore,
      authProvider: user.authProvider,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
