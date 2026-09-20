/**
 * Domain types for Wallet, Balances, and Financial Ledgers.
 */

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'FEE';

export interface WalletBalances {
  available: number;
  frozen: number;
  total: number;
  currency: string;
}

export interface LedgerEntry {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  referenceId: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'SETTLED' | 'FAILED';
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'ESCROW' | 'KYC' | 'SECURITY' | 'GAMING' | 'PAYMENT';
  read: boolean;
  createdAt: string;
}
