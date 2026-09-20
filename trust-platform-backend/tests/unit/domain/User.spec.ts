import { describe, it, expect } from 'vitest';
import { User } from '../../../src/domain/entities/User.js';
import { IllegalStateTransitionError } from '../../../src/shared/errors/index.js';

describe('User Domain Entity', () => {
  const defaultUserId = '11111111-1111-4111-8111-111111111111';

  describe('create() factory', () => {
    it('creates a new user with default properties', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');

      expect(user.id).toBe(defaultUserId);
      expect(user.email).toBe('user@example.com');
      expect(user.phone).toBeNull();
      expect(user.displayName).toBe('');
      expect(user.avatarUrl).toBeNull();
      expect(user.kycStatus).toBe('UNVERIFIED');
      expect(user.trustScore).toBe(50);
      expect(user.authProvider).toBe('email');
      expect(user.isKycVerified).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a user with phone number and phone auth provider', () => {
      const user = User.create(defaultUserId, null, '+919876543210', 'phone');

      expect(user.id).toBe(defaultUserId);
      expect(user.email).toBeNull();
      expect(user.phone).toBe('+919876543210');
      expect(user.authProvider).toBe('phone');
    });
  });

  describe('fromPersistence() and toPersistence()', () => {
    it('reconstitutes an existing user and maps to persistence correctly', () => {
      const pastDate = new Date('2026-01-01T00:00:00.000Z');
      const user = User.fromPersistence({
        id: defaultUserId,
        email: 'alice@trustvault.io',
        phone: '+919999999999',
        display_name: 'Alice Cooper',
        avatar_url: 'https://cdn.trustvault.io/avatars/alice.png',
        kyc_status: 'VERIFIED',
        trust_score: 85,
        auth_provider: 'google',
        created_at: pastDate.toISOString(),
        updated_at: pastDate.toISOString(),
      });

      expect(user.id).toBe(defaultUserId);
      expect(user.displayName).toBe('Alice Cooper');
      expect(user.avatarUrl).toBe('https://cdn.trustvault.io/avatars/alice.png');
      expect(user.kycStatus).toBe('VERIFIED');
      expect(user.isKycVerified).toBe(true);
      expect(user.trustScore).toBe(85);

      const persisted = user.toPersistence();
      expect(persisted).toEqual({
        id: defaultUserId,
        email: 'alice@trustvault.io',
        phone: '+919999999999',
        display_name: 'Alice Cooper',
        avatar_url: 'https://cdn.trustvault.io/avatars/alice.png',
        kyc_status: 'VERIFIED',
        trust_score: 85,
        auth_provider: 'google',
        updated_at: expect.any(String),
      });
    });
  });

  describe('profile updates', () => {
    it('updates display name and updates timestamp', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      const initialUpdatedAt = user.updatedAt.getTime();

      user.updateDisplayName('Super Trader');
      expect(user.displayName).toBe('Super Trader');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt);
    });

    it('updates avatar URL and allows clearing it to null', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      user.updateAvatarUrl('https://example.com/avatar.jpg');
      expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');

      user.updateAvatarUrl(null);
      expect(user.avatarUrl).toBeNull();
    });
  });

  describe('KYC status transitions', () => {
    it('allows valid transition UNVERIFIED -> PENDING', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      user.transitionKycStatus('PENDING');
      expect(user.kycStatus).toBe('PENDING');
      expect(user.isKycVerified).toBe(false);
    });

    it('allows valid transition PENDING -> VERIFIED', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      user.transitionKycStatus('PENDING');
      user.transitionKycStatus('VERIFIED');
      expect(user.kycStatus).toBe('VERIFIED');
      expect(user.isKycVerified).toBe(true);
    });

    it('allows valid transition PENDING -> REJECTED -> PENDING', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      user.transitionKycStatus('PENDING');
      user.transitionKycStatus('REJECTED');
      expect(user.kycStatus).toBe('REJECTED');
      expect(user.isKycVerified).toBe(false);

      user.transitionKycStatus('PENDING');
      expect(user.kycStatus).toBe('PENDING');
    });

    it('throws IllegalStateTransitionError for invalid transition UNVERIFIED -> VERIFIED', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      expect(() => user.transitionKycStatus('VERIFIED')).toThrow(IllegalStateTransitionError);
    });

    it('throws IllegalStateTransitionError for transition out of terminal VERIFIED status', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');
      user.transitionKycStatus('PENDING');
      user.transitionKycStatus('VERIFIED');
      expect(() => user.transitionKycStatus('PENDING')).toThrow(IllegalStateTransitionError);
      expect(() => user.transitionKycStatus('REJECTED')).toThrow(IllegalStateTransitionError);
    });
  });

  describe('trust score updates', () => {
    it('updates and clamps trust score between 0 and 100', () => {
      const user = User.create(defaultUserId, 'user@example.com', null, 'email');

      user.updateTrustScore(80);
      expect(user.trustScore).toBe(80);

      user.updateTrustScore(150);
      expect(user.trustScore).toBe(100);

      user.updateTrustScore(-20);
      expect(user.trustScore).toBe(0);

      user.updateTrustScore(74.6);
      expect(user.trustScore).toBe(75);
    });
  });
});
