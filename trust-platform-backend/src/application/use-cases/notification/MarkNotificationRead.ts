import type { INotificationRepository } from '../../interfaces/INotificationRepository.js';
import type { NotificationResponseDTO } from '../../dtos/notification.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/**
 * Use case: Mark a single notification as read by user.
 */
export class MarkNotificationRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(id: string, userId: string): Promise<NotificationResponseDTO> {
    const updated = await this.notificationRepository.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification', id);
    }

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      title: updated.title,
      body: updated.body,
      data: updated.data,
      isRead: updated.isRead,
      readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
