import { apiClient } from '../api/client';
import { EscrowTransaction, NotificationItem } from '../types';
import { MOCK_ESCROWS, MOCK_NOTIFICATIONS } from '../api/mockData';

export interface TrustScoreFactor {
  title: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface TrustScoreBreakdown {
  currentScore: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  factors: TrustScoreFactor[];
  decayWarning: boolean;
  daysUntilDecay: number;
}

export const homeService = {
  /**
   * Fetch active escrows for current user
   */
  async getActiveEscrows(): Promise<EscrowTransaction[]> {
    try {
      const res = await apiClient.axios.get('/escrow/active');
      return res.data;
    } catch {
      return MOCK_ESCROWS;
    }
  },

  /**
   * Fetch comprehensive trust score breakdown
   */
  async getTrustScoreBreakdown(): Promise<TrustScoreBreakdown> {
    try {
      const res = await apiClient.axios.get('/trust-score/me');
      return res.data;
    } catch {
      return {
        currentScore: 845,
        tier: 'GOLD',
        decayWarning: false,
        daysUntilDecay: 24,
        factors: [
          {
            title: 'Escrows Completed Without Dispute',
            points: 420,
            maxPoints: 500,
            description: '14 successful transactions concluded',
          },
          {
            title: 'Dispute Arbitration Win Rate',
            points: 200,
            maxPoints: 200,
            description: '100% win rate in 2 community votes',
          },
          {
            title: 'Government Identity Verification (KYC)',
            points: 150,
            maxPoints: 150,
            description: 'Aadhaar & PAN Tier-3 verified',
          },
          {
            title: 'Account Longevity & Activity',
            points: 75,
            maxPoints: 150,
            description: 'Active trader for 8 months',
          },
        ],
      };
    }
  },

  /**
   * Fetch user notifications
   */
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.axios.get('/notifications');
      return res.data;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.axios.patch(`/notifications/${id}/read`);
    } catch {
      // Mock fallback
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.axios.post('/notifications/read-all');
    } catch {
      // Mock fallback
    }
  },
};
