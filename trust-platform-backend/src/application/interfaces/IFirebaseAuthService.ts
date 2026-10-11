/**
 * Authenticated user payload extracted from a verified Firebase ID token.
 */
export interface VerifiedFirebaseUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Port Contract: External Firebase Authentication Verifier.
 * Verifies client-side Firebase ID tokens (e.g. from SMS OTP Phone Auth or Google Sign-In).
 */
export interface IFirebaseAuthService {
  /**
   * Verifies an incoming Firebase ID token passed from mobile clients.
   *
   * @param idToken - Raw JWT string from Firebase client SDK
   * @returns Verified user information
   * @throws Error if token is expired, revoked, or signature is invalid
   */
  verifyIdToken(idToken: string): Promise<VerifiedFirebaseUser>;
}
