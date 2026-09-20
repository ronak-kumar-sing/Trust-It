import { z } from 'zod';
import { TRUST_SCORE_ADJUSTMENTS } from '../../shared/constants/index.js';

export const AdjustTrustScoreSchema = z.object({
  adjustmentType: z.enum(
    Object.keys(TRUST_SCORE_ADJUSTMENTS) as [
      keyof typeof TRUST_SCORE_ADJUSTMENTS,
      ...(keyof typeof TRUST_SCORE_ADJUSTMENTS)[],
    ],
    { message: 'Invalid trust score adjustment type' },
  ),
  referenceId: z.string().optional(),
});

export type AdjustTrustScoreInput = z.infer<typeof AdjustTrustScoreSchema>;

export const TrustScoreUserIdParamSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),
});

export type TrustScoreUserIdParam = z.infer<typeof TrustScoreUserIdParamSchema>;
