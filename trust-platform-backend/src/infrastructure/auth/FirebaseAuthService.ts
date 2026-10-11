import type {
  IFirebaseAuthService,
  VerifiedFirebaseUser,
} from '../../application/interfaces/IFirebaseAuthService.js';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase/firebaseAdmin.js';

/**
 * Production Firebase Authentication service.
 *
 * Verifies Firebase client-side ID tokens (SMS OTP phone tokens and Google Sign-In).
 * In development or unconfigured mode, it transparently validates mock tokens to support
 * end-to-end preview flows.
 */
export class FirebaseAuthService implements IFirebaseAuthService {
  /**
   * Verifies an incoming Firebase ID token.
   *
   * @param idToken - Raw JWT string from mobile client
   * @returns Verified user credentials
   * @throws Error if token is invalid or authentication fails
   */
  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
    const auth = getFirebaseAuth();

    if (isFirebaseConfigured() && auth) {
      try {
        const decoded = await auth.verifyIdToken(idToken);
        return {
          uid: decoded.uid,
          phoneNumber: decoded.phone_number,
          email: decoded.email,
          emailVerified: decoded.email_verified,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid Firebase ID token';
        throw new Error(`Firebase token verification failed: ${message}`);
      }
    }

    // Dev / Test Mock Token Handler
    if (idToken.startsWith('mock_') || idToken.startsWith('jwt_mock_')) {
      return {
        uid: `usr_fb_mock_${idToken.slice(0, 12)}`,
        phoneNumber: '+919876543210',
        email: 'preview.trader@trustvault.app',
        emailVerified: true,
      };
    }

    throw new Error('Firebase Authentication is not configured and token is not a recognized mock token');
  }
}
