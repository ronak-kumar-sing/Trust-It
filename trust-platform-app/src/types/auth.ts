/**
 * Auth and User domain types for TrustVault frontend.
 * Matches backend schemas from Clean Architecture Phase 2.
 */
export type KycStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type TrustTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  kycStatus: KycStatus;
  trustScore: number;
  tier: TrustTier;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
