import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Notification } from '../../src/domain/entities/Notification.js';
import { NotificationType } from '../../src/domain/enums/NotificationType.js';
import type {
  IUserRepository,
  INotificationRepository,
  IPushNotificationService,
  PushNotificationPayload,
  NotificationQueryOptions,
} from '../../src/application/interfaces/index.js';

describe('Notification Routes Integration', () => {
  let app: FastifyInstance;

  const usersDb = new Map<string, User>();
  const notificationsDb = new Map<string, Notification>();
  const pushSentLog: PushNotificationPayload[] = [];

  const userId = '33333333-3333-4333-8333-333333333333';

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      return usersDb.get(id) ?? null;
    },
    async findByEmail() { return null; },
    async findByPhone() { return null; },
    async create() {},
    async update() {},
  };

  const mockNotificationRepo: INotificationRepository = {
    async create(notification: Notification) {
      notificationsDb.set(notification.id, notification);
    },
    async findById(id: string) {
      return notificationsDb.get(id) ?? null;
    },
    async findByUserId(uid: string, options?: NotificationQueryOptions) {
      let list = Array.from(notificationsDb.values()).filter((n) => n.userId === uid);
      if (options?.unreadOnly) {
        list = list.filter((n) => !n.isRead);
      }
      return list;
    },
    async markAsRead(id: string, uid: string) {
      const n = notificationsDb.get(id);
      if (!n || n.userId !== uid) return null;
      n.markAsRead();
      return n;
    },
    async markAllAsRead(uid: string) {
      let count = 0;
      for (const n of notificationsDb.values()) {
        if (n.userId === uid && !n.isRead) {
          n.markAsRead();
          count++;
        }
      }
      return count;
    },
    async getUnreadCount(uid: string) {
      return Array.from(notificationsDb.values()).filter(
        (n) => n.userId === uid && !n.isRead,
      ).length;
    },
  };

  const mockPushService: IPushNotificationService = {
    async sendPushNotification(payload) {
      pushSentLog.push(payload);
      return { success: true, messageId: 'fcm_mock_id' };
    },
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
    RAZORPAY_KEY_ID: 'mock_rzp_id',
    RAZORPAY_KEY_SECRET: 'mock_rzp_secret',
  };

  let initialNotificationId: string;

  beforeAll(async () => {
    // Seed user
    const user = User.create(userId, 'notifuser@trustvault.io', null, 'email');
    usersDb.set(userId, user);

    // Seed initial notifications
    const n1 = Notification.create({
      id: 'notif_seed_1',
      userId,
      type: NotificationType.ESCROW_FUNDED,
      title: 'Escrow Funded',
      body: 'Deposit locked in escrow',
    });
    const n2 = Notification.create({
      id: 'notif_seed_2',
      userId,
      type: NotificationType.DELIVERY_SUBMITTED,
      title: 'Delivery Ready',
      body: 'Seller submitted files',
    });
    notificationsDb.set(n1.id, n1);
    notificationsDb.set(n2.id, n2);
    initialNotificationId = n1.id;

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      notificationRepository: mockNotificationRepo,
      pushNotificationService: mockPushService,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/notifications', () => {
    it('returns 401 without authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns list of notifications and unread counter for user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.notifications.length).toBe(2);
      expect(json.data.unreadCount).toBe(2);
    });
  });

  describe('POST /api/v1/notifications/send', () => {
    it('dispatches new notification and pushes to mock push gateway', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/send',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_notif_send_1',
        },
        payload: {
          userId,
          type: NotificationType.CHALLENGE_ACCEPTED,
          title: 'Challenge Accepted',
          body: 'Your gaming challenge was accepted!',
          data: { challengeId: 'ch_44' },
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Challenge Accepted');
      expect(pushSentLog.length).toBeGreaterThan(0);
      expect(pushSentLog[pushSentLog.length - 1].title).toBe('Challenge Accepted');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('marks a specific notification as read', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${initialNotificationId}/read`,
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_read_1',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(initialNotificationId);
      expect(json.data.isRead).toBe(true);
      expect(json.data.readAt).toBeDefined();
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('marks all remaining notifications as read', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/read-all',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_read_all_1',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.count).toBeGreaterThan(0);

      // Verify unread count is now 0
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
        },
      });

      const listJson = JSON.parse(listRes.body);
      expect(listJson.data.unreadCount).toBe(0);
    });
  });
});
