import { create } from 'zustand';
import { WalletBalances, LedgerEntry } from '../types/wallet';
import { MOCK_BALANCES, MOCK_LEDGER } from '../api/mockData';

export interface WalletState {
  balances: WalletBalances;
  ledger: LedgerEntry[];
  isLoading: boolean;

  setBalances: (balances: WalletBalances) => void;
  creditFunds: (amount: number, referenceId: string) => void;
  debitFunds: (amount: number, referenceId: string) => void;
}

/**
 * Global Zustand store for user escrow balances and transaction history.
 */
export const useWalletStore = create<WalletState>((set, get) => ({
  balances: MOCK_BALANCES,
  ledger: MOCK_LEDGER,
  isLoading: false,

  setBalances: (balances) => set({ balances }),

  creditFunds: (amount, referenceId) => {
    const { balances, ledger } = get();
    const newEntry: LedgerEntry = {
      id: `ledg_${Date.now()}`,
      type: 'DEPOSIT',
      amount,
      fee: 0,
      referenceId,
      description: 'Deposit credited via Razorpay',
      createdAt: new Date().toISOString(),
      status: 'SETTLED',
    };
    set({
      balances: {
        ...balances,
        available: balances.available + amount,
        total: balances.total + amount,
      },
      ledger: [newEntry, ...ledger],
    });
  },

  debitFunds: (amount, referenceId) => {
    const { balances, ledger } = get();
    const newEntry: LedgerEntry = {
      id: `ledg_${Date.now()}`,
      type: 'WITHDRAWAL',
      amount: -amount,
      fee: 50,
      referenceId,
      description: 'Withdrawal to bank account',
      createdAt: new Date().toISOString(),
      status: 'SETTLED',
    };
    set({
      balances: {
        ...balances,
        available: Math.max(0, balances.available - amount),
        total: Math.max(0, balances.total - amount),
      },
      ledger: [newEntry, ...ledger],
    });
  },
}));
