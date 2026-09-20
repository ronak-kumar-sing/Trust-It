import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  SendNotification,
  GetUserNotifications,
  MarkNotificationRead,
  MarkAllNotificationsRead,
} from '../../application/use-cases/notification/index.js';
import {
  GetNotificationsQuerySchema,
  NotificationIdParamSchema,
  SendNotificationSchema,
} from '../validators/notificationValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling in-app and push notification queries and state updates.
 */
export function createNotificationController(
  sendNotification: SendNotification,
  getUserNotifications: GetUserNotifications,
  markNotificationRead: MarkNotificationRead,
  markAllNotificationsRead: MarkAllNotificationsRead,
) {
  return {
    /**
     * GET /notifications
     * Returns paginated notifications and unread counter for authenticated user.
     */
    async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const query = GetNotificationsQuerySchema.parse(request.query);
      const result = await getUserNotifications.execute(request.user.id, query);

      await reply.status(200).send({
        success: true,
        data: result,
      });
    },

    /**
     * PATCH /notifications/:id/read
     * Marks a specific notification as read.
     */
    async markAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const params = NotificationIdParamSchema.parse(request.params);
      const updated = await markNotificationRead.execute(params.id, request.user.id);

      const responseBody = {
        success: true,
        data: updated,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /notifications/read-all
     * Marks all unread notifications for authenticated user as read.
     */
    async markAllAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const result = await markAllNotificationsRead.execute(request.user.id);

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /notifications/send
     * Internal or admin dispatch of a notification with push broadcast.
     */
    async send(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const body = SendNotificationSchema.parse(request.body);
      const created = await sendNotification.execute({
        userId: body.userId,
        type: body.type,
        title: body.title,
        body: body.body,
        data: body.data,
      });

      const responseBody = {
        success: true,
        data: created,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },
  };
}
