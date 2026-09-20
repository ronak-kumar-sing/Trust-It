import type { Notification } from '../../domain/entities/Notification.js';

export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Port Contract: Notification Persistence Repository.
 */
export interface INotificationRepository {
  /** Saves a new notification */
  create(notification: Notification): Promise<void>;

  /** Finds a notification by ID */
  findById(id: string): Promise<Notification | null>;

  /** Retrieves paginated notifications for a specific user */
  findByUserId(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<Notification[]>;

  /** Marks a single notification as read */
  markAsRead(id: string, userId: string): Promise<Notification | null>;

  /** Marks all unread notifications for a user as read */
  markAllAsRead(userId: string): Promise<number>;

  /** Gets total count of unread notifications for a user */
  getUnreadCount(userId: string): Promise<number>;
}
