import { type KycStatusType, KYC_TRANSITIONS } from '../enums/index.js';
import { IllegalStateTransitionError } from '../../shared/errors/index.js';

/**
 * User domain entity.
 * Represents a platform user with identity verification and trust scoring.
 * Encapsulates KYC status transitions and business invariants.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    private _displayName: string,
    private _avatarUrl: string | null,
    private _kycStatus: KycStatusType,
    private _trustScore: number,
    public readonly authProvider: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /** Current display name */
  get displayName(): string {
    return this._displayName;
  }

  /** Current avatar URL */
  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  /** Current KYC verification status */
  get kycStatus(): KycStatusType {
    return this._kycStatus;
  }

  /** Current trust score (0-100) */
  get trustScore(): number {
    return this._trustScore;
  }

  /** Last update timestamp */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Creates a new User from registration data.
   *
   * @param id - User ID (from auth provider)
   * @param email - Email address (nullable for phone-only users)
   * @param phone - Phone number (nullable for email-only users)
   * @param authProvider - Authentication provider ('phone', 'google', etc.)
   * @returns New User instance with default KYC and trust score
   */
  static create(
    id: string,
    email: string | null,
    phone: string | null,
    authProvider: string,
  ): User {
    return new User(
      id,
      email,
      phone,
      '',
      null,
      'UNVERIFIED',
      50,
      authProvider,
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitutes a User from persistence data.
   *
   * @param props - All user properties from database
   * @returns Reconstituted User instance
   */
  static fromPersistence(props: {
    id: string;
    email: string | null;
    phone: string | null;
    display_name: string;
    avatar_url: string | null;
    kyc_status: KycStatusType;
    trust_score: number;
    auth_provider: string;
    created_at: string;
    updated_at: string;
  }): User {
    return new User(
      props.id,
      props.email,
      props.phone,
      props.display_name,
      props.avatar_url,
      props.kyc_status,
      props.trust_score,
      props.auth_provider,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  /**
   * Updates the user's display name.
   *
   * @param name - New display name
   */
  updateDisplayName(name: string): void {
    this._displayName = name;
    this._updatedAt = new Date();
  }

  /**
   * Updates the user's avatar URL.
   *
   * @param url - New avatar URL (or null to remove)
   */
  updateAvatarUrl(url: string | null): void {
    this._avatarUrl = url;
    this._updatedAt = new Date();
  }

  /**
   * Transitions the KYC status.
   * Validates against the KYC transition table.
   *
   * @param newStatus - Target KYC status
   * @throws {IllegalStateTransitionError} if transition is invalid
   */
  transitionKycStatus(newStatus: KycStatusType): void {
    const allowed = KYC_TRANSITIONS[this._kycStatus];
    if (!allowed.includes(newStatus)) {
      throw new IllegalStateTransitionError(this._kycStatus, newStatus);
    }
    this._kycStatus = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Updates the user's trust score.
   * Clamps the value between 0 and 100.
   *
   * @param newScore - New trust score value
   */
  updateTrustScore(newScore: number): void {
    this._trustScore = Math.max(0, Math.min(100, Math.round(newScore)));
    this._updatedAt = new Date();
  }

  /** Whether the user has completed KYC verification */
  get isKycVerified(): boolean {
    return this._kycStatus === 'VERIFIED';
  }

  /**
   * Serializes the user entity to a persistence-compatible object.
   * Used by repository implementations for database writes.
   *
   * @returns Plain object for database persistence
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      display_name: this._displayName,
      avatar_url: this._avatarUrl,
      kyc_status: this._kycStatus,
      trust_score: this._trustScore,
      auth_provider: this.authProvider,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
