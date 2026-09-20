import { z } from 'zod';

/**
 * Zod schema for creating deposit order.
 * Amount in paise (e.g., 50000 = ₹500.00). Minimum deposit: ₹10 (1,000 paise).
 */
export const CreateDepositOrderSchema = z.object({
  amount: z
    .number()
    .int({ message: 'Amount must be an integer in paise' })
    .min(1000, { message: 'Minimum deposit is ₹10 (1000 paise)' })
    .max(100000000, { message: 'Maximum single deposit is ₹10,00,000 (100000000 paise)' }),
});

export type CreateDepositOrderInput = z.infer<typeof CreateDepositOrderSchema>;

/**
 * Zod schema for verifying deposit payment.
 */
export const VerifyDepositSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required' }),
  paymentId: z.string().min(1, { message: 'Payment ID is required' }),
  signature: z.string().min(1, { message: 'Payment signature is required' }),
  amount: z
    .number()
    .int({ message: 'Amount must be an integer in paise' })
    .positive({ message: 'Amount must be positive' }),
});

export type VerifyDepositInput = z.infer<typeof VerifyDepositSchema>;

/**
 * Zod schema for withdrawing funds.
 * Minimum withdrawal: ₹100 (10,000 paise).
 */
export const WithdrawFundsSchema = z.object({
  amount: z
    .number()
    .int({ message: 'Amount must be an integer in paise' })
    .min(10000, { message: 'Minimum withdrawal is ₹100 (10000 paise)' }),
  destinationAccount: z
    .string()
    .min(5, { message: 'Destination account/UPI must be at least 5 characters' })
    .optional(),
});

export type WithdrawFundsInput = z.infer<typeof WithdrawFundsSchema>;

/**
 * Zod schema for pagination queries on transaction history.
 */
export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;
