/** Transaction types for the wallet ledger */
export const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  ESCROW_FREEZE: 'ESCROW_FREEZE',
  ESCROW_RELEASE: 'ESCROW_RELEASE',
  ESCROW_REFUND: 'ESCROW_REFUND',
  PLATFORM_FEE: 'PLATFORM_FEE',
  DISPUTE_DEPOSIT: 'DISPUTE_DEPOSIT',
  DISPUTE_REFUND: 'DISPUTE_REFUND',
  SLASH_PENALTY: 'SLASH_PENALTY',
} as const;

export type TransactionTypeValue = typeof TransactionType[keyof typeof TransactionType];
