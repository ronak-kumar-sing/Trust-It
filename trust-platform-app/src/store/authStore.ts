import { create } from 'zustand';
import { UserProfile, KycStatus, TrustTier } from '../types/auth';
import { apiClient } from '../api/client';
import { MOCK_USER } from '../api/mockData';

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  updateKyc: (status: KycStatus, tier?: TrustTier) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  clearError: () => void;
}

/**
 * Global Zustand store for user session and authentication.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  token: 'mock_jwt_token_initial',
  user: MOCK_USER,
  isAuthenticated: true, // Default to authenticated for instant preview of all tabs; can toggle to test auth flow
  isLoading: false,
  error: null,

  setToken: (token) => {
    apiClient.setToken(token);
    set({ token, isAuthenticated: Boolean(token) });
  },

  setUser: (user) => {
    set({ user });
  },

  loginWithPhone: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      // Calls Fastify backend endpoint or falls back gracefully
      try {
        await apiClient.axios.post('/auth/register', { phone });
      } catch {
        // Fallback for offline/preview mode
      }
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  verifyOtp: async (_phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      if (otp === '123456') {
        const fakeToken = `jwt_mock_${Date.now()}`;
        apiClient.setToken(fakeToken);
        set({
          token: fakeToken,
          user: MOCK_USER,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        throw new Error('Invalid verification code. Use 123456 in preview.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  updateKyc: (status: KycStatus, tier: TrustTier = 'GOLD') => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          kycStatus: status,
          tier,
        },
      });
    }
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...updates,
        },
      });
    }
  },

  logout: () => {
    apiClient.setToken(null);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
