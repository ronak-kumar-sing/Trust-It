import {
  type EscrowStatusType,
  ESCROW_TRANSITIONS,
  TERMINAL_STATES,
  type EscrowTypeValue,
} from '../enums/index.js';
import { IllegalStateTransitionError } from '../../shared/errors/index.js';

/**
 * Represents a state change event emitted when an escrow transitions.
 * Used for audit logging and side-effect triggering.
 */
export interface StateChangeEvent {
  /** Escrow transaction ID */
  entityId: string;
  /** Previous status */
  fromState: EscrowStatusType;
  /** New status */
  toState: EscrowStatusType;
  /** Who triggered the transition (userId or 'SYSTEM_TIMER') */
  actorId: string;
  /** ISO timestamp of the transition */
  timestamp: string;
}

/**
 * EscrowTransaction domain entity.
 * Core entity implementing the deterministic escrow state machine.
 *
 * State transitions:
 * INITIATED → FUNDED_IN_ESCROW → DELIVERED → INSPECTION_PERIOD → RELEASED/DISPUTED → RELEASED/REFUNDED
 *
 * Uses optimistic locking via version field to prevent concurrent modification.
 */
export class EscrowTransaction {
  private constructor(
    public readonly id: string,
    public readonly type: EscrowTypeValue,
    public readonly buyerId: string,
    public readonly sellerId: string,
    public readonly amount: number,
    public readonly platformFee: number,
    private _status: EscrowStatusType,
    private _inspectionDeadline: Date | null,
    private _version: number,
    private _metadata: Record<string, unknown>,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  /** Current escrow status */
  get status(): EscrowStatusType {
    return this._status;
  }

  /** Inspection window deadline (null if not in inspection) */
  get inspectionDeadline(): Date | null {
    return this._inspectionDeadline;
  }

  /** Optimistic locking version */
  get version(): number {
    return this._version;
  }

  /** Arbitrary metadata attached to the transaction */
  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  /** Last update timestamp */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  /**
   * Creates a new escrow transaction in INITIATED state.
   *
   * @param props - Transaction creation properties
   * @returns New EscrowTransaction instance
   */
  static create(props: {
    id: string;
    type: EscrowTypeValue;
    buyerId: string;
    sellerId: string;
    amount: number;
    platformFee: number;
    metadata?: Record<string, unknown>;
  }): EscrowTransaction {
    return new EscrowTransaction(
      props.id,
      props.type,
      props.buyerId,
      props.sellerId,
      props.amount,
      props.platformFee,
      'INITIATED',
      null,
      1,
      props.metadata ?? {},
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitutes from persistence data.
   *
   * @param props - Database row properties
   * @returns Reconstituted EscrowTransaction instance
   */
  static fromPersistence(props: {
    id: string;
    type: EscrowTypeValue;
    buyer_id: string;
    seller_id: string;
    amount: number;
    platform_fee: number;
    status: EscrowStatusType;
    inspection_deadline: string | null;
    version: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }): EscrowTransaction {
    return new EscrowTransaction(
      props.id,
      props.type,
      props.buyer_id,
      props.seller_id,
      props.amount,
      props.platform_fee,
      props.status,
      props.inspection_deadline ? new Date(props.inspection_deadline) : null,
      props.version,
      props.metadata,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── State Machine ────────────────────────────────────────────

  /**
   * Transitions the escrow to a new state.
   * Validates the transition against the transition table.
   * Increments the version for optimistic locking.
   *
   * @param targetState - The desired new state
   * @param actor - Who is triggering this transition (userId or 'SYSTEM_TIMER')
   * @returns The state change event for audit logging
   * @throws {IllegalStateTransitionError} if the transition is not in the transition table
   */
  transition(targetState: EscrowStatusType, actor: string): StateChangeEvent {
    const allowed = ESCROW_TRANSITIONS[this._status];
    if (!allowed.includes(targetState)) {
      throw new IllegalStateTransitionError(this._status, targetState);
    }

    const event: StateChangeEvent = {
      entityId: this.id,
      fromState: this._status,
      toState: targetState,
      actorId: actor,
      timestamp: new Date().toISOString(),
    };

    this._status = targetState;
    this._version += 1;
    this._updatedAt = new Date();

    return event;
  }

  /**
   * Sets the inspection deadline.
   * Should be called when transitioning to INSPECTION_PERIOD.
   *
   * @param deadline - The deadline timestamp
   */
  setInspectionDeadline(deadline: Date): void {
    this._inspectionDeadline = deadline;
    this._updatedAt = new Date();
  }

  // ── Query Methods ────────────────────────────────────────────

  /** Whether the transaction is in a terminal state (no more transitions possible) */
  get isTerminal(): boolean {
    return (TERMINAL_STATES as readonly string[]).includes(this._status);
  }

  /** Whether the transaction can be disputed */
  get isDisputable(): boolean {
    return this._status === 'INSPECTION_PERIOD';
  }

  /**
   * Whether the inspection window has expired.
   *
   * @param now - Current time (default: new Date())
   * @returns True if in INSPECTION_PERIOD and deadline has passed
   */
  isInspectionExpired(now: Date = new Date()): boolean {
    if (this._status !== 'INSPECTION_PERIOD') return false;
    if (!this._inspectionDeadline) return false;
    return now >= this._inspectionDeadline;
  }

  /**
   * Serializes for database persistence.
   *
   * @returns Plain object for database writes
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      buyer_id: this.buyerId,
      seller_id: this.sellerId,
      amount: this.amount,
      platform_fee: this.platformFee,
      status: this._status,
      inspection_deadline: this._inspectionDeadline?.toISOString() ?? null,
      version: this._version,
      metadata: this._metadata,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
