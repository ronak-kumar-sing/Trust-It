import { type NotificationTypeValue } from '../enums/NotificationType.js';
import { ValidationError } from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Notification Domain Entity.
 * Represents an in-app and push notification delivered to a user.
 */
export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationTypeValue,
    public readonly title: string,
    public readonly body: string,
    public readonly data: Record<string, unknown>,
    private _readAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  /** Timestamp when notification was read, or null if unread */
  get readAt(): Date | null {
    return this._readAt;
  }

  /** Whether the notification has been marked as read */
  get isRead(): boolean {
    return this._readAt !== null;
  }

  /**
   * Factory method to create a new notification.
   *
   * @param props - Notification creation attributes
   * @returns A new unread Notification instance
   * @throws {ValidationError} When title or userId is missing
   */
  static create(props: {
    id?: string;
    userId: string;
    type: NotificationTypeValue;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Notification {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new ValidationError('Notification userId is required');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError('Notification title is required');
    }

    return new Notification(
      props.id ?? nanoid(),
      props.userId,
      props.type,
      props.title.trim(),
      props.body ?? '',
      props.data ?? {},
      null,
      new Date(),
    );
  }

  /**
   * Reconstitutes a Notification entity from database row.
   *
   * @param props - Raw database row representation
   * @returns Reconstituted Notification instance
   */
  static fromPersistence(props: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
  }): Notification {
    return new Notification(
      props.id,
      props.user_id,
      props.type as NotificationTypeValue,
      props.title,
      props.body,
      props.data ?? {},
      props.read_at ? new Date(props.read_at) : null,
      new Date(props.created_at),
    );
  }

  /**
   * Marks notification as read if not already read.
   */
  markAsRead(): void {
    if (!this._readAt) {
      this._readAt = new Date();
    }
  }
}
