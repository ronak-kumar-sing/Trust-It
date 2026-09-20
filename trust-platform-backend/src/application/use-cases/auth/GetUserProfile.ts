import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { UserProfileDTO } from '../../dtos/auth.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Retrieve a user's profile by ID.
 */
export class GetUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Retrieves profile for given user ID.
   *
   * @param userId - Target user UUID
   * @returns User profile representation
   * @throws {NotFoundError} When user does not exist
   */
  async execute(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

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
