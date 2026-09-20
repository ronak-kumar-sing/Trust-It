import type { VerificationStatusType } from '../enums/ChallengeStatus.js';
import { ValidationError } from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * MatchResult Domain Entity.
 * Represents a player's reported match outcome and accompanying evidence.
 */
export class MatchResult {
  private constructor(
    public readonly id: string,
    public readonly challengeId: string,
    public readonly reporterId: string,
    public readonly claimedWinnerId: string,
    public readonly evidenceUrl: string | null,
    private _verificationStatus: VerificationStatusType,
    private _aiConfidence: number | null,
    public readonly createdAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  get verificationStatus(): VerificationStatusType {
    return this._verificationStatus;
  }

  get aiConfidence(): number | null {
    return this._aiConfidence;
  }

  // ── Factory Methods ──────────────────────────────────────────

  static create(params: {
    id?: string;
    challengeId: string;
    reporterId: string;
    claimedWinnerId: string;
    evidenceUrl?: string | null;
    verificationStatus?: VerificationStatusType;
    aiConfidence?: number | null;
  }): MatchResult {
    if (!params.challengeId?.trim()) {
      throw new ValidationError('Challenge ID is required');
    }
    if (!params.reporterId?.trim()) {
      throw new ValidationError('Reporter ID is required');
    }
    if (!params.claimedWinnerId?.trim()) {
      throw new ValidationError('Claimed winner ID is required');
    }

    return new MatchResult(
      params.id ?? nanoid(),
      params.challengeId,
      params.reporterId,
      params.claimedWinnerId,
      params.evidenceUrl?.trim() ?? null,
      params.verificationStatus ?? 'PENDING',
      params.aiConfidence ?? null,
      new Date(),
    );
  }

  static fromPersistence(props: {
    id: string;
    challenge_id: string;
    reporter_id: string;
    claimed_winner_id: string;
    evidence_url: string | null;
    verification_status: VerificationStatusType;
    ai_confidence: number | null;
    created_at: string;
  }): MatchResult {
    return new MatchResult(
      props.id,
      props.challenge_id,
      props.reporter_id,
      props.claimed_winner_id,
      props.evidence_url,
      props.verification_status,
      props.ai_confidence !== null ? Number(props.ai_confidence) : null,
      new Date(props.created_at),
    );
  }

  // ── Mutations ────────────────────────────────────────────────

  setVerification(status: VerificationStatusType, confidence: number): void {
    this._verificationStatus = status;
    this._aiConfidence = confidence;
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      challenge_id: this.challengeId,
      reporter_id: this.reporterId,
      claimed_winner_id: this.claimedWinnerId,
      evidence_url: this.evidenceUrl,
      verification_status: this._verificationStatus,
      ai_confidence: this._aiConfidence,
      created_at: this.createdAt.toISOString(),
    };
  }
}
