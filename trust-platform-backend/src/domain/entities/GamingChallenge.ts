import type { ChallengeStatusType } from '../enums/ChallengeStatus.js';
import {
  ValidationError,
  InvalidAmountError,
  IllegalStateTransitionError,
} from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * Gaming Challenge Domain Entity.
 * Represents a competitive 1v1 wager match with dual stake locking.
 */
export class GamingChallenge {
  private constructor(
    public readonly id: string,
    public readonly challengerId: string,
    private _opponentId: string | null,
    private _gameTitle: string,
    private _stakeAmount: number,
    private _rules: Record<string, unknown>,
    private _status: ChallengeStatusType,
    private _escrowTransactionId: string | null,
    private _responseDeadline: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  get opponentId(): string | null {
    return this._opponentId;
  }

  get gameTitle(): string {
    return this._gameTitle;
  }

  get stakeAmount(): number {
    return this._stakeAmount;
  }

  /** Total prize pot: challenger stake + opponent stake */
  get totalPot(): number {
    return this._stakeAmount * 2;
  }

  get rules(): Record<string, unknown> {
    return { ...this._rules };
  }

  get status(): ChallengeStatusType {
    return this._status;
  }

  get escrowTransactionId(): string | null {
    return this._escrowTransactionId;
  }

  get responseDeadline(): Date | null {
    return this._responseDeadline;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  static create(params: {
    id?: string;
    challengerId: string;
    opponentId?: string | null;
    gameTitle: string;
    stakeAmount: number;
    rules?: Record<string, unknown>;
  }): GamingChallenge {
    if (params.opponentId && params.challengerId === params.opponentId) {
      throw new ValidationError('Challenger cannot challenge themselves');
    }

    const trimmedTitle = params.gameTitle.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      throw new ValidationError('Game title must be between 1 and 100 characters');
    }

    if (!Number.isInteger(params.stakeAmount) || params.stakeAmount <= 0) {
      throw new InvalidAmountError(params.stakeAmount);
    }

    return new GamingChallenge(
      params.id ?? nanoid(),
      params.challengerId,
      params.opponentId ?? null,
      trimmedTitle,
      params.stakeAmount,
      params.rules ?? {},
      'OPEN',
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static fromPersistence(props: {
    id: string;
    challenger_id: string;
    opponent_id: string | null;
    game_title: string;
    stake_amount: number | string;
    rules: Record<string, unknown>;
    status: ChallengeStatusType;
    escrow_transaction_id: string | null;
    response_deadline: string | null;
    created_at: string;
    updated_at: string;
  }): GamingChallenge {
    return new GamingChallenge(
      props.id,
      props.challenger_id,
      props.opponent_id,
      props.game_title,
      Number(props.stake_amount),
      props.rules,
      props.status,
      props.escrow_transaction_id,
      props.response_deadline ? new Date(props.response_deadline) : null,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── State Transitions ────────────────────────────────────────

  /**
   * Opponent accepts challenge and locks matching stake into escrow.
   */
  accept(opponentId: string, escrowTransactionId: string): void {
    if (this._status !== 'OPEN') {
      throw new IllegalStateTransitionError(this._status, 'ACCEPTED');
    }
    if (opponentId === this.challengerId) {
      throw new ValidationError('Challenger cannot accept their own challenge');
    }
    if (this._opponentId && this._opponentId !== opponentId) {
      throw new ValidationError('This challenge is reserved for a specific opponent');
    }

    this._opponentId = opponentId;
    this._escrowTransactionId = escrowTransactionId;
    this._status = 'ACCEPTED';
    this._updatedAt = new Date();
  }

  /**
   * Starts match gameplay.
   */
  startMatch(): void {
    if (this._status !== 'ACCEPTED') {
      throw new IllegalStateTransitionError(this._status, 'IN_PROGRESS');
    }
    this._status = 'IN_PROGRESS';
    this._updatedAt = new Date();
  }

  /**
   * First report received: opens 30-minute response deadline.
   */
  reportFirstResult(deadline: Date): void {
    if (
      this._status !== 'IN_PROGRESS' &&
      this._status !== 'ACCEPTED' &&
      this._status !== 'RESULTS_REPORTED'
    ) {
      throw new IllegalStateTransitionError(this._status, 'RESULTS_REPORTED');
    }
    this._status = 'RESULTS_REPORTED';
    this._responseDeadline = deadline;
    this._updatedAt = new Date();
  }

  /**
   * Second report matches first report (consensus reached).
   */
  reachConsensus(): void {
    if (this._status !== 'RESULTS_REPORTED') {
      throw new IllegalStateTransitionError(this._status, 'CONSENSUS_REACHED');
    }
    this._status = 'CONSENSUS_REACHED';
    this._responseDeadline = null;
    this._updatedAt = new Date();
  }

  /**
   * Reports conflict (conflicting winners reported).
   */
  dispute(): void {
    if (this._status !== 'RESULTS_REPORTED' && this._status !== 'IN_PROGRESS') {
      throw new IllegalStateTransitionError(this._status, 'DISPUTED');
    }
    this._status = 'DISPUTED';
    this._responseDeadline = null;
    this._updatedAt = new Date();
  }

  /**
   * Payout completed and match settled.
   */
  complete(): void {
    if (
      this._status !== 'CONSENSUS_REACHED' &&
      this._status !== 'RESULTS_REPORTED' &&
      this._status !== 'DISPUTED'
    ) {
      throw new IllegalStateTransitionError(this._status, 'COMPLETED');
    }
    this._status = 'COMPLETED';
    this._responseDeadline = null;
    this._updatedAt = new Date();
  }

  /**
   * Mutual or creator cancellation.
   */
  cancel(): void {
    if (this._status === 'COMPLETED' || this._status === 'DISPUTED') {
      throw new IllegalStateTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
    this._responseDeadline = null;
    this._updatedAt = new Date();
  }

  /**
   * Checks if the 30-minute opponent response window has expired.
   */
  isResponseExpired(): boolean {
    if (!this._responseDeadline) return false;
    return Date.now() >= this._responseDeadline.getTime();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      challenger_id: this.challengerId,
      opponent_id: this._opponentId,
      game_title: this._gameTitle,
      stake_amount: this._stakeAmount,
      rules: this._rules,
      status: this._status,
      escrow_transaction_id: this._escrowTransactionId,
      response_deadline: this._responseDeadline?.toISOString() ?? null,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
