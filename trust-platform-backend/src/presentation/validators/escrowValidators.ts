import { z } from 'zod';
import { EscrowType, EscrowStatus } from '../../domain/enums/index.js';

export const CreateEscrowSchema = z.object({
  sellerId: z.string().uuid({ message: 'Seller ID must be a valid UUID' }),
  type: z.enum(
    [
      EscrowType.DIGITAL_GOODS,
      EscrowType.FREELANCE_MILESTONE,
      EscrowType.GAMING_WAGER,
    ],
    { message: 'Invalid escrow type' },
  ),
  amount: z
    .number()
    .int({ message: 'Amount must be an integer in paise' })
    .positive({ message: 'Amount must be greater than zero' }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateEscrowInput = z.infer<typeof CreateEscrowSchema>;

export const TransitionEscrowSchema = z.object({
  targetState: z.enum(
    [
      EscrowStatus.INITIATED,
      EscrowStatus.FUNDED_IN_ESCROW,
      EscrowStatus.DELIVERED,
      EscrowStatus.INSPECTION_PERIOD,
      EscrowStatus.DISPUTED,
      EscrowStatus.RELEASED,
      EscrowStatus.REFUNDED,
      EscrowStatus.CANCELLED,
    ],
    { message: 'Invalid target state' },
  ),
});

export type TransitionEscrowInput = z.infer<typeof TransitionEscrowSchema>;

export const DisputeEscrowSchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Dispute reason must be at least 10 characters long' })
    .max(2000, { message: 'Dispute reason cannot exceed 2000 characters' }),
  evidenceUrls: z
    .array(z.string().url({ message: 'Evidence must be valid URLs' }))
    .optional(),
});

export type DisputeEscrowInput = z.infer<typeof DisputeEscrowSchema>;

export const EscrowIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Escrow ID is required' }),
});

export type EscrowIdParam = z.infer<typeof EscrowIdParamSchema>;
