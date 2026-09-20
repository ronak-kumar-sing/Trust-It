/**
 * Output DTO for wallet balances.
 */
export interface WalletBalanceDTO {
  walletId: string;
  userId: string;
  availableBalance: number;
  frozenBalance: number;
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  version: number;
}

/**
 * Input DTO for creating a deposit order with payment gateway.
 */
export interface CreateDepositOrderDTO {
  userId: string;
  amount: number;
}

/**
 * Output DTO for created deposit order.
 */
export interface DepositOrderResultDTO {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Input DTO for verifying and capturing a deposit payment.
 */
export interface VerifyDepositDTO {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  amount: number;
}

/**
 * Input DTO for funds withdrawal.
 */
export interface WithdrawFundsDTO {
  userId: string;
  amount: number;
  destinationAccount?: string;
}

/**
 * Input DTO for freezing funds in escrow.
 */
export interface FreezeForEscrowDTO {
  userId: string;
  amount: number;
  escrowTransactionId: string;
}

/**
 * Input DTO for releasing funds from escrow to seller.
 */
export interface ReleaseFromEscrowDTO {
  buyerId?: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  escrowTransactionId: string;
}

/**
 * Input DTO for refunding escrow funds back to buyer.
 */
export interface RefundFromEscrowDTO {
  buyerId: string;
  amount: number;
  escrowTransactionId: string;
}

/**
 * Output DTO for transaction ledger items.
 */
export interface TransactionLedgerDTO {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  description: string;
  createdAt: string;
}
