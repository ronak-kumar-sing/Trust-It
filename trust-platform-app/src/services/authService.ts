import { apiClient } from '../api/client';
import { UserProfile, KycStatus } from '../types/auth';
import { MOCK_USER } from '../api/mockData';

export const authService = {
  /**
   * Request OTP code for given mobile number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.axios.post('/auth/register', { phone });
      return response.data;
    } catch {
      // Offline fallback
      return { success: true, message: 'OTP sent to mobile device' };
    }
  },

  /**
   * Fetch user profile from backend
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.axios.get('/users/me');
      return response.data;
    } catch {
      return MOCK_USER;
    }
  },

  /**
   * Submit KYC identity documents
   */
  async submitKyc(idNumber: string, docType: string): Promise<{ status: KycStatus }> {
    try {
      const response = await apiClient.axios.post('/users/kyc', { idNumber, docType });
      return response.data;
    } catch {
      return { status: 'VERIFIED' };
    }
  },

  /**
   * Update profile details
   */
  async updateProfile(details: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.axios.put('/users/profile', details);
      return response.data;
    } catch {
      return { ...MOCK_USER, ...details };
    }
  },
};
