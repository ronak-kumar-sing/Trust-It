import type { INotificationRepository } from '../../interfaces/INotificationRepository.js';
import type {
  GetNotificationsQueryDTO,
  NotificationsListResponseDTO,
} from '../../dtos/notification.dto.js';

/**
 * Use case: Retrieve paginated notifications and unread counter for a user.
 */
export class GetUserNotifications {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(
    userId: string,
    query?: GetNotificationsQueryDTO,
  ): Promise<NotificationsListResponseDTO> {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findByUserId(userId, query),
      this.notificationRepository.getUnreadCount(userId),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }
}
