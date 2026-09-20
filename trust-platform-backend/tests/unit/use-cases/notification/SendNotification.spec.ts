import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SendNotification } from '../../../../src/application/use-cases/notification/SendNotification.js';
import { NotificationType } from '../../../../src/domain/enums/NotificationType.js';
import type {
  INotificationRepository,
  IPushNotificationService,
} from '../../../../src/application/interfaces/index.js';

describe('SendNotification Use Case', () => {
  let notificationRepo: INotificationRepository;
  let pushService: IPushNotificationService;
  let sendNotification: SendNotification;

  beforeEach(() => {
    notificationRepo = {
      create: vi.fn(async () => {}),
      findById: vi.fn(async () => null),
      findByUserId: vi.fn(async () => []),
      markAsRead: vi.fn(async () => null),
      markAllAsRead: vi.fn(async () => 0),
      getUnreadCount: vi.fn(async () => 0),
    };

    pushService = {
      sendPushNotification: vi.fn(async () => ({ success: true, messageId: 'fcm_123' })),
    };

    sendNotification = new SendNotification(notificationRepo, pushService);
  });

  it('persists notification in repository and sends push notification', async () => {
    const result = await sendNotification.execute({
      userId: 'usr_receiver_1',
      type: NotificationType.ESCROW_FUNDED,
      title: 'Funds In Escrow',
      body: 'Your buyer has funded ₹500.',
      data: { escrowId: 'esc_1' },
    });

    expect(result.id).toBeDefined();
    expect(result.userId).toBe('usr_receiver_1');
    expect(result.title).toBe('Funds In Escrow');
    expect(result.isRead).toBe(false);

    expect(notificationRepo.create).toHaveBeenCalledTimes(1);
    expect(pushService.sendPushNotification).toHaveBeenCalledWith({
      userId: 'usr_receiver_1',
      title: 'Funds In Escrow',
      body: 'Your buyer has funded ₹500.',
      data: { escrowId: 'esc_1' },
    });
  });

  it('does not throw if push notification service fails', async () => {
    vi.mocked(pushService.sendPushNotification).mockRejectedValueOnce(
      new Error('Push gateway unreachable'),
    );

    const result = await sendNotification.execute({
      userId: 'usr_receiver_2',
      type: NotificationType.CHALLENGE_RECEIVED,
      title: 'Match Challenge',
      body: 'You were challenged in FIFA 24.',
    });

    expect(result.id).toBeDefined();
    expect(notificationRepo.create).toHaveBeenCalledTimes(1);
  });
});
