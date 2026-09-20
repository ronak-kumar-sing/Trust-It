/**
 * Domain types for Gaming Wagers, Challenges, and Computer Vision Verification.
 */

export type GameTitle = 'BGMI' | 'VALORANT' | 'FIFA_24' | 'CHESS' | 'CS2';
export type ChallengeStatus = 'OPEN' | 'MATCHED' | 'IN_PROGRESS' | 'REPORTED' | 'VERIFYING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';

export interface GamingChallenge {
  id: string;
  game: GameTitle;
  creatorId: string;
  creatorName: string;
  creatorScore: number;
  opponentId?: string;
  opponentName?: string;
  stakeAmount: number;
  prizePool: number;
  status: ChallengeStatus;
  roomCode?: string;
  rules: string;
  createdAt: string;
}

export interface MatchVerification {
  challengeId: string;
  reportedWinnerId: string;
  evidenceUrl: string;
  cvConfidenceScore: number; // 0 - 100
  ocrDetectedWinner: string;
  antiTamperPassed: boolean;
  status: 'PENDING' | 'AUTO_CONFIRMED' | 'DISPUTED';
}

export interface LeaderboardPlayer {
  rank: number;
  userId: string;
  handle: string;
  trustScore: number;
  matchesPlayed: number;
  winRate: number;
  totalEarnings: number;
}
