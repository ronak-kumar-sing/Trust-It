import { describe, it, expect, beforeEach } from 'vitest';
import { FirebaseAuthService } from '../../../../src/infrastructure/auth/FirebaseAuthService.js';

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService;

  beforeEach(() => {
    authService = new FirebaseAuthService();
  });

  it('validates mock/preview token in development mode', async () => {
    const user = await authService.verifyIdToken('mock_firebase_token_99');

    expect(user.uid).toContain('usr_fb_mock_');
    expect(user.phoneNumber).toBe('+919876543210');
    expect(user.emailVerified).toBe(true);
  });

  it('validates jwt_mock_ format tokens', async () => {
    const user = await authService.verifyIdToken('jwt_mock_12345678');

    expect(user.uid).toBeDefined();
    expect(user.email).toBe('preview.trader@trustvault.app');
  });

  it('throws when unconfigured and given an unrecognized token', async () => {
    await expect(
      authService.verifyIdToken('invalid_unknown_token_format'),
    ).rejects.toThrow('Firebase Authentication is not configured');
  });
});
