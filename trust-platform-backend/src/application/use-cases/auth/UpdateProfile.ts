import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { UpdateProfileDTO, UserProfileDTO } from '../../dtos/auth.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Update user display name and avatar.
 */
export class UpdateProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Updates user profile fields.
   *
   * @param dto - Profile update payload
   * @returns Updated user profile representation
   * @throws {NotFoundError} When user does not exist
   */
  async execute(dto: UpdateProfileDTO): Promise<UserProfileDTO> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User', dto.userId);
    }

    if (dto.displayName !== undefined) {
      user.updateDisplayName(dto.displayName.trim());
    }

    if (dto.avatarUrl !== undefined) {
      user.updateAvatarUrl(dto.avatarUrl);
    }

    await this.userRepository.update(user);

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
