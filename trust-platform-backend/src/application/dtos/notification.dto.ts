import type { NotificationTypeValue } from '../../domain/enums/NotificationType.js';

export interface SendNotificationDTO {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationResponseDTO {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface GetNotificationsQueryDTO {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationsListResponseDTO {
  notifications: NotificationResponseDTO[];
  unreadCount: number;
}
