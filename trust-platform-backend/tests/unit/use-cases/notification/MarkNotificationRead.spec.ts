import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkNotificationRead } from '../../../../src/application/use-cases/notification/MarkNotificationRead.js';
import { Notification } from '../../../../src/domain/entities/Notification.js';
import { NotificationType } from '../../../../src/domain/enums/NotificationType.js';
import { NotFoundError } from '../../../../src/shared/errors/index.js';
import type { INotificationRepository } from '../../../../src/application/interfaces/index.js';

describe('MarkNotificationRead Use Case', () => {
  let notificationRepo: INotificationRepository;
  let markNotificationRead: MarkNotificationRead;

  beforeEach(() => {
    notificationRepo = {
      create: vi.fn(async () => {}),
      findById: vi.fn(async () => null),
      findByUserId: vi.fn(async () => []),
      markAsRead: vi.fn(async (id: string, userId: string) => {
        if (id === 'notif_valid' && userId === 'usr_owner') {
          const n = Notification.create({
            id: 'notif_valid',
            userId: 'usr_owner',
            type: NotificationType.ESCROW_RELEASED,
            title: 'Released',
            body: 'Escrow released',
          });
          n.markAsRead();
          return n;
        }
        return null;
      }),
      markAllAsRead: vi.fn(async () => 0),
      getUnreadCount: vi.fn(async () => 0),
    };

    markNotificationRead = new MarkNotificationRead(notificationRepo);
  });

  it('marks notification as read and returns response DTO', async () => {
    const result = await markNotificationRead.execute('notif_valid', 'usr_owner');

    expect(result.id).toBe('notif_valid');
    expect(result.isRead).toBe(true);
    expect(result.readAt).toBeDefined();
    expect(notificationRepo.markAsRead).toHaveBeenCalledWith('notif_valid', 'usr_owner');
  });

  it('throws NotFoundError when notification does not exist or user mismatch', async () => {
    await expect(
      markNotificationRead.execute('notif_nonexistent', 'usr_owner'),
    ).rejects.toThrow(NotFoundError);
  });
});
