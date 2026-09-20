import { apiClient, generateIdempotencyKey } from '../api/client';
import { WalletBalances, LedgerEntry, TransactionType } from '../types';
import { MOCK_BALANCES, MOCK_LEDGER } from '../api/mockData';

export const walletService = {
  /**
   * Fetch current wallet balances
   */
  async getBalances(): Promise<WalletBalances> {
    try {
      const res = await apiClient.axios.get('/wallet/balance');
      return res.data;
    } catch {
      return MOCK_BALANCES;
    }
  },

  /**
   * Create Razorpay deposit order
   */
  async createDepositOrder(amount: number): Promise<{ orderId: string; amount: number; keyId: string }> {
    try {
      const res = await apiClient.axios.post('/wallet/deposit/order', { amount }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('dep') },
      });
      return res.data;
    } catch {
      return {
        orderId: `order_rzp_${Date.now()}`,
        amount,
        keyId: 'rzp_test_mock_12345',
      };
    }
  },

  /**
   * Verify and credit Razorpay deposit
   */
  async verifyDeposit(orderId: string, paymentId: string, signature: string): Promise<void> {
    try {
      await apiClient.axios.post('/wallet/deposit/verify', {
        orderId,
        paymentId,
        signature,
      }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('ver_dep') },
      });
    } catch {
      // Mock fallback
    }
  },

  /**
   * Request withdrawal to bank account / UPI
   */
  async withdrawFunds(amount: number, destination: string): Promise<void> {
    try {
      await apiClient.axios.post('/wallet/withdraw', {
        amount,
        destination,
      }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('wth') },
      });
    } catch {
      // Mock fallback
    }
  },

  /**
   * Fetch immutable transaction ledger
   */
  async getLedger(type?: TransactionType): Promise<LedgerEntry[]> {
    try {
      const res = await apiClient.axios.get('/wallet/ledger', {
        params: { type },
      });
      return res.data;
    } catch {
      if (type) {
        return MOCK_LEDGER.filter((entry) => entry.type === type);
      }
      return MOCK_LEDGER;
    }
  },
};
