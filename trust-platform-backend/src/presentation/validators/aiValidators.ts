import { z } from 'zod';

export const VerifyCredentialsSchema = z.object({
  category: z.string().min(1, { message: 'Category is required' }),
  payload: z.union([z.string().min(1), z.record(z.string(), z.unknown())]),
  listingId: z.string().min(1).optional(),
});

export type VerifyCredentialsInput = z.infer<typeof VerifyCredentialsSchema>;

export const AssessGhostingSchema = z.object({
  userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
  lastActivityAt: z.string().datetime({ message: 'lastActivityAt must be an ISO 8601 string' }),
  pendingMilestoneCount: z.number().int().min(0).optional(),
  daysUntilDeadline: z.number().min(0).optional(),
});

export type AssessGhostingInput = z.infer<typeof AssessGhostingSchema>;
