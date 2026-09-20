import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../src/store/authStore';

describe('Part 3.2 — Auth Store & Session Management', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with clean unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it('should set token and mark as authenticated', () => {
    useAuthStore.getState().setToken('test_jwt_123');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('test_jwt_123');
  });

  it('should verify OTP and advance to authenticated session', async () => {
    const success = await useAuthStore.getState().verifyOtp('+919876543210', '123456');
    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toBeDefined();
  });

  it('should reject invalid OTP codes gracefully', async () => {
    const success = await useAuthStore.getState().verifyOtp('+919876543210', '000000');
    expect(success).toBe(false);
  });

  it('should update KYC status and tier', () => {
    useAuthStore.getState().setUser({
      id: 'usr_test',
      phone: '+919999999999',
      displayName: 'Test User',
      handle: '@test',
      kycStatus: 'UNVERIFIED',
      trustScore: 500,
      tier: 'BRONZE',
      createdAt: new Date().toISOString(),
    });

    useAuthStore.getState().updateKyc('VERIFIED', 'GOLD');
    expect(useAuthStore.getState().user?.kycStatus).toBe('VERIFIED');
    expect(useAuthStore.getState().user?.tier).toBe('GOLD');
  });

  it('should logout cleanly', () => {
    useAuthStore.getState().setToken('some_token');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
