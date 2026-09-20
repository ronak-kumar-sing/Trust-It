import { z } from 'zod';

export const CreateChallengeSchema = z.object({
  opponentId: z.string().uuid().nullable().optional(),
  gameTitle: z
    .string()
    .min(1, { message: 'Game title cannot be empty' })
    .max(100, { message: 'Game title cannot exceed 100 characters' }),
  stakeAmount: z
    .number()
    .int({ message: 'Stake amount must be an integer in paise' })
    .positive({ message: 'Stake amount must be positive' }),
  rules: z.record(z.string(), z.unknown()).optional(),
});

export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;

export const ReportMatchResultSchema = z.object({
  claimedWinnerId: z.string().uuid({ message: 'Claimed winner ID must be a valid UUID' }),
  evidenceUrl: z.string().url().nullable().optional(),
});

export type ReportMatchResultInput = z.infer<typeof ReportMatchResultSchema>;

export const ResolveGamingDisputeSchema = z.object({
  resolvedWinnerId: z.string().uuid({ message: 'Resolved winner ID must be a valid UUID' }),
  slashFraudulentStake: z.boolean().optional(),
  fraudulentPartyId: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
});

export type ResolveGamingDisputeInput = z.infer<
  typeof ResolveGamingDisputeSchema
>;

export const ChallengeFilterQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ChallengeFilterQuery = z.infer<typeof ChallengeFilterQuerySchema>;

export const ChallengeIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Challenge ID is required' }),
});

export type ChallengeIdParam = z.infer<typeof ChallengeIdParamSchema>;
