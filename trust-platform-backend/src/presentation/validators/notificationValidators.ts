import { z } from 'zod';
import { NotificationType } from '../../domain/enums/NotificationType.js';

export const GetNotificationsQuerySchema = z.object({
  unreadOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => val === true || val === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;

export const NotificationIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Notification ID is required' }),
});

export type NotificationIdParam = z.infer<typeof NotificationIdParamSchema>;

export const SendNotificationSchema = z.object({
  userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
  type: z.enum(
    Object.values(NotificationType) as [
      (typeof NotificationType)[keyof typeof NotificationType],
      ...(typeof NotificationType)[keyof typeof NotificationType][],
    ],
    { message: 'Invalid notification type' },
  ),
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title cannot exceed 200 characters' }),
  body: z.string().max(1000, { message: 'Body cannot exceed 1000 characters' }).default(''),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;
