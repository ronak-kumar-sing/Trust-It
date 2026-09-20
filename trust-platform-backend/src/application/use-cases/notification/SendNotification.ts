import { Notification } from '../../../domain/entities/Notification.js';
import type { INotificationRepository } from '../../interfaces/INotificationRepository.js';
import type { IPushNotificationService } from '../../interfaces/IPushNotificationService.js';
import type {
  SendNotificationDTO,
  NotificationResponseDTO,
} from '../../dtos/notification.dto.js';
import { nanoid } from 'nanoid';

/**
 * Use case: Send in-app and push notification to a user.
 */
export class SendNotification {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly pushNotificationService?: IPushNotificationService,
  ) {}

  /**
   * Executes notification dispatch.
   * Persists in-app notification and attempts push delivery without failing transaction if push fails.
   *
   * @param dto - Notification contents and target recipient
   * @returns Formatted notification response
   */
  async execute(dto: SendNotificationDTO): Promise<NotificationResponseDTO> {
    const notification = Notification.create({
      id: nanoid(),
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });

    await this.notificationRepository.create(notification);

    // Attempt push notification dispatch asynchronously
    if (this.pushNotificationService) {
      try {
        await this.pushNotificationService.sendPushNotification({
          userId: dto.userId,
          title: dto.title,
          body: dto.body,
          data: dto.data,
        });
      } catch (err) {
        // Push notification delivery failure should not break in-app notification persistence
      }
    }

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
