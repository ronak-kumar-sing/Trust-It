import { z } from 'zod';
import { KycStatus } from '../../domain/enums/index.js';

/**
 * Zod schema for user registration.
 */
export const RegisterUserSchema = z
  .object({
    id: z.string().uuid({ message: 'User ID must be a valid UUID' }),
    email: z.string().email({ message: 'Invalid email address' }).optional().nullable(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid E.164 phone number format' })
      .optional()
      .nullable(),
    displayName: z
      .string()
      .min(2, { message: 'Display name must be at least 2 characters' })
      .max(50, { message: 'Display name cannot exceed 50 characters' })
      .optional(),
    authProvider: z
      .enum(['email', 'phone', 'google', 'apple', 'mock'])
      .default('phone'),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'At least one of email or phone must be provided',
    path: ['email'],
  });

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

/**
 * Zod schema for profile updates.
 */
export const UpdateProfileSchema = z
  .object({
    displayName: z
      .string()
      .min(2, { message: 'Display name must be at least 2 characters' })
      .max(50, { message: 'Display name cannot exceed 50 characters' })
      .optional(),
    avatarUrl: z
      .string()
      .url({ message: 'Avatar URL must be a valid URL' })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.displayName !== undefined || data.avatarUrl !== undefined,
    {
      message: 'At least one field (displayName or avatarUrl) must be provided to update',
    },
  );

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Zod schema for KYC status updates (admin / verification webhook).
 */
export const UpdateKycStatusSchema = z.object({
  targetStatus: z.enum(
    [KycStatus.PENDING, KycStatus.VERIFIED, KycStatus.REJECTED],
    { message: 'Target status must be PENDING, VERIFIED, or REJECTED' },
  ),
  reason: z.string().max(500).optional(),
});

export type UpdateKycStatusInput = z.infer<typeof UpdateKycStatusSchema>;

/**
 * User ID route parameter schema.
 */
export const UserIdParamSchema = z.object({
  id: z.string().uuid({ message: 'User ID must be a valid UUID' }),
});

export type UserIdParam = z.infer<typeof UserIdParamSchema>;
