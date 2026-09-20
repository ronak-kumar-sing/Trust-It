import type { KycStatusType } from '../../domain/enums/index.js';

/**
 * Input DTO for user registration.
 */
export interface RegisterUserDTO {
  /** User UUID from auth provider */
  readonly id: string;
  /** User email (optional if phone provided) */
  readonly email?: string | null;
  /** User phone (optional if email provided) */
  readonly phone?: string | null;
  /** Initial display name */
  readonly displayName?: string;
  /** Authentication provider used (e.g., 'email', 'phone', 'google') */
  readonly authProvider: string;
}

/**
 * Output DTO for registered user.
 */
export interface RegisterUserResultDTO {
  readonly id: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly kycStatus: KycStatusType;
  readonly isKycVerified: boolean;
  readonly trustScore: number;
  readonly authProvider: string;
  readonly walletId: string;
  readonly availableBalance: number;
  readonly frozenBalance: number;
  readonly createdAt: string;
}

/**
 * Input DTO for updating a user profile.
 */
export interface UpdateProfileDTO {
  /** Target user UUID */
  readonly userId: string;
  /** New display name */
  readonly displayName?: string;
  /** New avatar URL (or null to clear) */
  readonly avatarUrl?: string | null;
}

/**
 * Input DTO for updating KYC status.
 */
export interface UpdateKycStatusDTO {
  /** Target user UUID */
  readonly userId: string;
  /** Target KYC status */
  readonly targetStatus: KycStatusType;
  /** ID of administrator/service making the change */
  readonly actorId: string;
  /** Optional reason for status change (e.g., rejection reason) */
  readonly reason?: string;
}

/**
 * Output DTO for user profile representation.
 */
export interface UserProfileDTO {
  readonly id: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly kycStatus: KycStatusType;
  readonly isKycVerified: boolean;
  readonly trustScore: number;
  readonly authProvider: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
