import type { MilestoneStatusType } from '../enums/ProjectStatus.js';
import {
  InvalidAmountError,
  ValidationError,
  IllegalStateTransitionError,
} from '../../shared/errors/index.js';
import { MAX_REVISION_ROUNDS } from '../../shared/constants/index.js';
import { nanoid } from 'nanoid';

/**
 * Milestone domain entity.
 * Represents an individual milestone within a freelance project, backed by escrow.
 */
export class Milestone {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    private _title: string,
    private _description: string,
    private _amount: number,
    private _sowText: string,
    private _status: MilestoneStatusType,
    private _qualityGateResult: Record<string, unknown> | null,
    private _submissionUrl: string | null,
    private _revisionCount: number,
    private _escrowTransactionId: string | null,
    private _reviewDeadline: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get amount(): number {
    return this._amount;
  }

  get sowText(): string {
    return this._sowText;
  }

  get status(): MilestoneStatusType {
    return this._status;
  }

  get qualityGateResult(): Record<string, unknown> | null {
    return this._qualityGateResult ? { ...this._qualityGateResult } : null;
  }

  get submissionUrl(): string | null {
    return this._submissionUrl;
  }

  get revisionCount(): number {
    return this._revisionCount;
  }

  get escrowTransactionId(): string | null {
    return this._escrowTransactionId;
  }

  get reviewDeadline(): Date | null {
    return this._reviewDeadline;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  static create(params: {
    id?: string;
    projectId: string;
    title: string;
    description?: string;
    amount: number;
    sowText?: string;
  }): Milestone {
    const trimmedTitle = params.title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      throw new ValidationError('Milestone title must be between 3 and 200 characters');
    }
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new InvalidAmountError(params.amount);
    }

    return new Milestone(
      params.id ?? nanoid(),
      params.projectId,
      trimmedTitle,
      params.description?.trim() ?? '',
      params.amount,
      params.sowText?.trim() ?? '',
      'PENDING',
      null,
      null,
      0,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static fromPersistence(props: {
    id: string;
    project_id: string;
    title: string;
    description: string;
    amount: number | string;
    sow_text: string;
    status: MilestoneStatusType;
    quality_gate_result: Record<string, unknown> | null;
    submission_url: string | null;
    revision_count: number;
    escrow_transaction_id: string | null;
    review_deadline: string | null;
    created_at: string;
    updated_at: string;
  }): Milestone {
    return new Milestone(
      props.id,
      props.project_id,
      props.title,
      props.description,
      Number(props.amount),
      props.sow_text,
      props.status,
      props.quality_gate_result,
      props.submission_url,
      props.revision_count,
      props.escrow_transaction_id,
      props.review_deadline ? new Date(props.review_deadline) : null,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── State Transitions ────────────────────────────────────────

  /**
   * Sets the milestone to FUNDED when escrow is funded.
   */
  fund(escrowTransactionId: string): void {
    if (this._status !== 'PENDING') {
      throw new IllegalStateTransitionError(this._status, 'FUNDED');
    }
    this._status = 'FUNDED';
    this._escrowTransactionId = escrowTransactionId;
    this._updatedAt = new Date();
  }

  /**
   * Freelancer marks milestone work as in progress.
   */
  startWork(): void {
    if (this._status !== 'FUNDED') {
      throw new IllegalStateTransitionError(this._status, 'IN_PROGRESS');
    }
    this._status = 'IN_PROGRESS';
    this._updatedAt = new Date();
  }

  /**
   * Freelancer submits deliverable URL.
   */
  submitDeliverable(submissionUrl: string): void {
    if (this._status !== 'IN_PROGRESS' && this._status !== 'CHANGES_REQUESTED') {
      throw new IllegalStateTransitionError(this._status, 'SUBMITTED');
    }
    if (!submissionUrl?.trim()) {
      throw new ValidationError('Submission URL cannot be empty');
    }
    this._submissionUrl = submissionUrl.trim();
    this._status = 'SUBMITTED';
    this._updatedAt = new Date();
  }

  /**
   * Records AI quality gate verification result and opens client review window.
   */
  triggerQualityGate(result: Record<string, unknown>, reviewDeadline: Date): void {
    if (this._status !== 'SUBMITTED') {
      throw new IllegalStateTransitionError(this._status, 'UNDER_REVIEW');
    }
    this._qualityGateResult = { ...result };
    this._reviewDeadline = reviewDeadline;
    this._status = 'UNDER_REVIEW';
    this._updatedAt = new Date();
  }

  /**
   * Client requests changes. Enforces a maximum of 3 revision rounds.
   */
  requestChanges(): void {
    if (this._status !== 'UNDER_REVIEW') {
      throw new IllegalStateTransitionError(this._status, 'CHANGES_REQUESTED');
    }
    if (this._revisionCount >= MAX_REVISION_ROUNDS) {
      throw new ValidationError(
        `Maximum ${MAX_REVISION_ROUNDS} revision rounds exceeded. Milestone must be approved or disputed.`,
      );
    }
    this._revisionCount += 1;
    this._status = 'CHANGES_REQUESTED';
    this._updatedAt = new Date();
  }

  /**
   * Client approves the milestone deliverable.
   */
  approve(): void {
    if (this._status !== 'UNDER_REVIEW') {
      throw new IllegalStateTransitionError(this._status, 'APPROVED');
    }
    this._status = 'APPROVED';
    this._updatedAt = new Date();
  }

  /**
   * Funds released from escrow to freelancer.
   */
  release(): void {
    if (this._status !== 'APPROVED' && this._status !== 'UNDER_REVIEW') {
      throw new IllegalStateTransitionError(this._status, 'RELEASED');
    }
    this._status = 'RELEASED';
    this._updatedAt = new Date();
  }

  /**
   * Escalates milestone to dispute.
   */
  dispute(): void {
    if (this._status !== 'UNDER_REVIEW' && this._status !== 'CHANGES_REQUESTED') {
      throw new IllegalStateTransitionError(this._status, 'DISPUTED');
    }
    this._status = 'DISPUTED';
    this._updatedAt = new Date();
  }

  /**
   * Cancels milestone.
   */
  cancel(): void {
    if (this._status === 'RELEASED' || this._status === 'DISPUTED') {
      throw new IllegalStateTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
    this._updatedAt = new Date();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      project_id: this.projectId,
      title: this._title,
      description: this._description,
      amount: this._amount,
      sow_text: this._sowText,
      status: this._status,
      quality_gate_result: this._qualityGateResult,
      submission_url: this._submissionUrl,
      revision_count: this._revisionCount,
      escrow_transaction_id: this._escrowTransactionId,
      review_deadline: this._reviewDeadline?.toISOString() ?? null,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
