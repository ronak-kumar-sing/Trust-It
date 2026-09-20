import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import type {
  IUserRepository,
  IWalletRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IPaymentGateway,
  AuditEvent,
} from '../../src/application/interfaces/index.js';

describe('Wallet Routes Integration', () => {
  let app: FastifyInstance;

  const testUserId = '33333333-3333-4333-8333-333333333333';
  const walletsDb = new Map<string, Wallet>();
  const ledgerDb: TransactionLedger[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      if (id === testUserId) {
        return User.create(testUserId, 'trader@trustvault.io', null, 'email');
      }
      return null;
    },
    async findByEmail() {
      return null;
    },
    async findByPhone() {
      return null;
    },
    async create() {},
    async update() {},
  };

  const mockWalletRepo: IWalletRepository = {
    async findById(id: string) {
      return walletsDb.get(id) ?? null;
    },
    async findByUserId(userId: string) {
      for (const w of walletsDb.values()) {
        if (w.userId === userId) return w;
      }
      return null;
    },
    async create(wallet: Wallet) {
      walletsDb.set(wallet.id, wallet);
    },
    async save(wallet: Wallet) {
      walletsDb.set(wallet.id, wallet);
    },
  };

  const mockLedgerRepo: ITransactionLedgerRepository = {
    async create(entry: TransactionLedger) {
      ledgerDb.unshift(entry);
    },
    async findByWalletId(walletId: string, limit = 50, offset = 0) {
      return ledgerDb
        .filter((l) => l.walletId === walletId)
        .slice(offset, offset + limit);
    },
  };

  const mockAuditLogger: IAuditLogger = {
    async log() {},
  };

  const mockPaymentGateway: IPaymentGateway = {
    async createOrder(params) {
      return {
        orderId: 'order_int_test_123',
        amount: params.amount,
        currency: 'INR',
      };
    },
    verifyPaymentSignature() {
      return true; // Auto-verify in integration mock
    },
    async processRefund() {
      return { refundId: 'rfnd_int_123', status: 'processed' };
    },
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3002,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
    RAZORPAY_KEY_ID: 'mock_rzp_id',
    RAZORPAY_KEY_SECRET: 'mock_rzp_secret',
  };

  beforeAll(async () => {
    // Seed initial wallet for test user
    const initialWallet = Wallet.create('w-int-test-1', testUserId);
    walletsDb.set(initialWallet.id, initialWallet);

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      transactionLedgerRepository: mockLedgerRepo,
      auditLogger: mockAuditLogger,
      paymentGateway: mockPaymentGateway,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/wallet/balance', () => {
    it('returns 401 without auth header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/wallet/balance',
      });
      expect(response.statusCode).toBe(401);
    });

    it('returns 200 with balance when authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/wallet/balance',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.availableBalance).toBe(0);
      expect(json.data.frozenBalance).toBe(0);
      expect(json.data.totalBalance).toBe(0);
    });
  });

  describe('POST /api/v1/wallet/deposit/order', () => {
    it('creates deposit order with gateway', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/deposit/order',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          amount: 50000, // ₹500
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.data.orderId).toBe('order_int_test_123');
      expect(json.data.amount).toBe(50000);
      expect(json.data.currency).toBe('INR');
    });

    it('rejects deposit amount below minimum ₹10 (1000 paise)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/deposit/order',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          amount: 500, // ₹5 — below min
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/wallet/deposit/verify', () => {
    it('verifies deposit signature, credits wallet, and records ledger', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/deposit/verify',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
          'idempotency-key': 'idem-deposit-001',
        },
        payload: {
          orderId: 'order_int_test_123',
          paymentId: 'pay_rzp_99999',
          signature: 'mock_sig_valid',
          amount: 50000,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.availableBalance).toBe(50000);
      expect(json.data.totalBalance).toBe(50000);

      // Verify ledger
      expect(ledgerDb.length).toBeGreaterThan(0);
      expect(ledgerDb[0]!.type).toBe('DEPOSIT');
      expect(ledgerDb[0]!.amount).toBe(50000);
    });
  });

  describe('POST /api/v1/wallet/withdraw', () => {
    it('withdraws funds when balance is sufficient', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/withdraw',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          amount: 20000, // ₹200
          destinationAccount: 'alice@okhdfcbank',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.availableBalance).toBe(30000); // 50000 - 20000
    });

    it('rejects withdrawal when available balance is insufficient', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/withdraw',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          amount: 100000, // ₹1,000 — exceeds available ₹300
        },
      });

      expect(response.statusCode).toBe(422);
      const json = JSON.parse(response.body);
      expect(json.error.error).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('GET /api/v1/wallet/transactions', () => {
    it('returns history of transaction ledger entries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/wallet/transactions?limit=10&offset=0',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(2); // 1 deposit + 1 withdrawal
      expect(json.data[0].type).toBe('WITHDRAWAL');
      expect(json.data[1].type).toBe('DEPOSIT');
    });
  });
});
