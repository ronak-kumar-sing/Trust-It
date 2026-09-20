import type { FastifyInstance } from 'fastify';
import type {
  SendNotification,
  GetUserNotifications,
  MarkNotificationRead,
  MarkAllNotificationsRead,
} from '../../application/use-cases/notification/index.js';
import { createNotificationController } from '../controllers/notificationController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface NotificationRoutesOptions {
  sendNotification: SendNotification;
  getUserNotifications: GetUserNotifications;
  markNotificationRead: MarkNotificationRead;
  markAllNotificationsRead: MarkAllNotificationsRead;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for notification operations.
 * Mounts:
 * - GET   /api/v1/notifications
 * - PATCH /api/v1/notifications/:id/read
 * - POST  /api/v1/notifications/read-all
 * - POST  /api/v1/notifications/send
 */
export async function notificationRoutes(
  fastify: FastifyInstance,
  options: NotificationRoutesOptions,
): Promise<void> {
  const controller = createNotificationController(
    options.sendNotification,
    options.getUserNotifications,
    options.markNotificationRead,
    options.markAllNotificationsRead,
  );

  // List notifications for current authenticated user
  fastify.get('/', {
    preHandler: [options.authenticate],
    handler: controller.list,
  });

  // Mark single notification as read
  fastify.patch('/:id/read', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.markAsRead,
  });

  // Mark all unread notifications as read
  fastify.post('/read-all', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.markAllAsRead,
  });

  // Send notification (service or admin action)
  fastify.post('/send', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.send,
  });
}
