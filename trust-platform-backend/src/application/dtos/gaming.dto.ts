import type {
  ChallengeStatusType,
  VerificationStatusType,
} from '../../domain/enums/ChallengeStatus.js';
import type { EscrowDetailsDTO } from './escrow.dto.js';

export interface CreateChallengeDTO {
  challengerId: string;
  opponentId?: string | null;
  gameTitle: string;
  stakeAmount: number;
  rules?: Record<string, unknown>;
}

export interface AcceptChallengeDTO {
  challengeId: string;
  opponentId: string;
}

export interface ReportMatchResultDTO {
  challengeId: string;
  reporterId: string;
  claimedWinnerId: string;
  evidenceUrl?: string | null;
}

export interface ClaimTimeoutWinDTO {
  challengeId: string;
  reporterId: string;
}

export interface ResolveGamingDisputeDTO {
  challengeId: string;
  adminId: string;
  resolvedWinnerId: string;
  slashFraudulentStake?: boolean;
  fraudulentPartyId?: string;
  reason?: string;
}

export interface CancelChallengeDTO {
  challengeId: string;
  userId: string;
}

export interface MatchResultDTO {
  id: string;
  challengeId: string;
  reporterId: string;
  claimedWinnerId: string;
  evidenceUrl: string | null;
  verificationStatus: VerificationStatusType;
  aiConfidence: number | null;
  createdAt: string;
}

export interface GamingChallengeDTO {
  id: string;
  challengerId: string;
  opponentId: string | null;
  gameTitle: string;
  stakeAmount: number;
  totalPot: number;
  rules: Record<string, unknown>;
  status: ChallengeStatusType;
  escrowTransactionId: string | null;
  responseDeadline: string | null;
  matchResults?: MatchResultDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AcceptChallengeResultDTO {
  challenge: GamingChallengeDTO;
  escrow: EscrowDetailsDTO;
}

export interface SettlementResultDTO {
  challenge: GamingChallengeDTO;
  settlementScenario: string;
  winnerId: string | null;
  payoutAmount: number;
  platformFee: number;
  slashedAmount?: number;
}
