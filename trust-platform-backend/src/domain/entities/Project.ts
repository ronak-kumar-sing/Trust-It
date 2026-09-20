import type { ProjectStatusType } from '../enums/ProjectStatus.js';
import {
  InvalidAmountError,
  ValidationError,
  IllegalStateTransitionError,
} from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * Project domain entity.
 * Encapsulates a freelance contract consisting of multiple milestones.
 */
export class Project {
  private constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly freelancerId: string,
    private _title: string,
    private _description: string,
    private _totalBudget: number,
    private _status: ProjectStatusType,
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

  get totalBudget(): number {
    return this._totalBudget;
  }

  get status(): ProjectStatusType {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  static create(params: {
    id?: string;
    clientId: string;
    freelancerId: string;
    title: string;
    description?: string;
    totalBudget: number;
    status?: ProjectStatusType;
  }): Project {
    if (params.clientId === params.freelancerId) {
      throw new ValidationError('Client and freelancer must be different parties');
    }
    const trimmedTitle = params.title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      throw new ValidationError('Project title must be between 3 and 200 characters');
    }
    if (!Number.isInteger(params.totalBudget) || params.totalBudget <= 0) {
      throw new InvalidAmountError(params.totalBudget);
    }

    return new Project(
      params.id ?? nanoid(),
      params.clientId,
      params.freelancerId,
      trimmedTitle,
      params.description?.trim() ?? '',
      params.totalBudget,
      params.status ?? 'ACTIVE',
      new Date(),
      new Date(),
    );
  }

  static fromPersistence(props: {
    id: string;
    client_id: string;
    freelancer_id: string;
    title: string;
    description: string;
    total_budget: number | string;
    status: ProjectStatusType;
    created_at: string;
    updated_at: string;
  }): Project {
    return new Project(
      props.id,
      props.client_id,
      props.freelancer_id,
      props.title,
      props.description,
      Number(props.total_budget),
      props.status,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── State Transitions ────────────────────────────────────────

  complete(): void {
    if (this._status !== 'ACTIVE') {
      throw new IllegalStateTransitionError(this._status, 'COMPLETED');
    }
    this._status = 'COMPLETED';
    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status === 'COMPLETED') {
      throw new IllegalStateTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
    this._updatedAt = new Date();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      client_id: this.clientId,
      freelancer_id: this.freelancerId,
      title: this._title,
      description: this._description,
      total_budget: this._totalBudget,
      status: this._status,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
