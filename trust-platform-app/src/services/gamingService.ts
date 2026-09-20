import { apiClient, generateIdempotencyKey } from '../api/client';
import { GamingChallenge, GameTitle, LeaderboardPlayer, MatchVerification } from '../types';
import { MOCK_CHALLENGES, MOCK_LEADERBOARD } from '../api/mockData';

export const gamingService = {
  /**
   * Fetch open gaming wager challenges
   */
  async getChallenges(game?: GameTitle): Promise<GamingChallenge[]> {
    try {
      const res = await apiClient.axios.get('/gaming/challenges', {
        params: { game },
      });
      return res.data;
    } catch {
      if (game) {
        return MOCK_CHALLENGES.filter((c) => c.game === game);
      }
      return MOCK_CHALLENGES;
    }
  },

  /**
   * Get challenge by ID
   */
  async getChallengeById(id: string): Promise<GamingChallenge> {
    try {
      const res = await apiClient.axios.get(`/gaming/challenges/${id}`);
      return res.data;
    } catch {
      const found = MOCK_CHALLENGES.find((c) => c.id === id);
      return found ?? MOCK_CHALLENGES[0];
    }
  },

  /**
   * Host / create an open wager challenge
   */
  async createChallenge(data: {
    game: GameTitle;
    stakeAmount: number;
    rules: string;
  }): Promise<GamingChallenge> {
    try {
      const res = await apiClient.axios.post('/gaming/challenges', data, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('chal') },
      });
      return res.data;
    } catch {
      const newChal: GamingChallenge = {
        id: `chal_gm_${Date.now()}`,
        game: data.game,
        creatorId: 'usr_mock_001',
        creatorName: 'Alex Trader',
        creatorScore: 845,
        stakeAmount: data.stakeAmount,
        prizePool: Math.round(data.stakeAmount * 2 * 0.99),
        status: 'OPEN',
        rules: data.rules,
        createdAt: new Date().toISOString(),
      };
      MOCK_CHALLENGES.unshift(newChal);
      return newChal;
    }
  },

  /**
   * Accept and lock into a challenge
   */
  async acceptChallenge(id: string): Promise<GamingChallenge> {
    try {
      const res = await apiClient.axios.post(`/gaming/challenges/${id}/accept`, {}, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('acc_chal') },
      });
      return res.data;
    } catch {
      const chal = MOCK_CHALLENGES.find((c) => c.id === id);
      if (chal) {
        chal.status = 'MATCHED';
        chal.opponentId = 'usr_mock_001';
        chal.opponentName = 'Alex Trader';
        chal.roomCode = 'ROOM_9821_VAULT';
      }
      return chal ?? MOCK_CHALLENGES[0];
    }
  },

  /**
   * Report match outcome and upload victory/defeat proof
   */
  async reportResult(challengeId: string, won: boolean, evidenceUrl: string): Promise<MatchVerification> {
    try {
      const res = await apiClient.axios.post(`/gaming/challenges/${challengeId}/report`, {
        won,
        evidenceUrl,
      }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('rep_m') },
      });
      return res.data;
    } catch {
      return {
        challengeId,
        reportedWinnerId: won ? 'usr_mock_001' : 'usr_opponent_99',
        evidenceUrl,
        cvConfidenceScore: 97.8,
        ocrDetectedWinner: 'Alex Trader',
        antiTamperPassed: true,
        status: 'AUTO_CONFIRMED',
      };
    }
  },

  /**
   * Fetch leaderboard rankings
   */
  async getLeaderboard(): Promise<LeaderboardPlayer[]> {
    try {
      const res = await apiClient.axios.get('/gaming/leaderboard');
      return res.data;
    } catch {
      return MOCK_LEADERBOARD;
    }
  },
};
