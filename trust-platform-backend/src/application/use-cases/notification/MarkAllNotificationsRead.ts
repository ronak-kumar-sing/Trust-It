import type { INotificationRepository } from '../../interfaces/INotificationRepository.js';

/**
 * Use case: Mark all unread notifications as read for a user.
 */
export class MarkAllNotificationsRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.markAllAsRead(userId);
    return { count };
  }
}
