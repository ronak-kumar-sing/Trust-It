import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IPaymentGateway,
  IEscrowQueue,
} from '../../src/application/interfaces/index.js';

describe('Escrow Routes Integration', () => {
  let app: FastifyInstance;

  const buyerId = '44444444-4444-4444-8444-444444444444';
  const sellerId = '55555555-5555-4555-8555-555555555555';

  const escrowsDb = new Map<string, EscrowTransaction>();
  const walletsDb = new Map<string, Wallet>();
  const ledgersDb: TransactionLedger[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      if (id === buyerId) return User.create(buyerId, 'buyer@test.io', null, 'email');
      if (id === sellerId) return User.create(sellerId, 'seller@test.io', null, 'email');
      return null;
    },
    async findByEmail() { return null; },
    async findByPhone() { return null; },
    async create() {},
    async update() {},
  };

  const mockWalletRepo: IWalletRepository = {
    async findById(id: string) { return walletsDb.get(id) ?? null; },
    async findByUserId(userId: string) {
      for (const w of walletsDb.values()) {
        if (w.userId === userId) return w;
      }
      return null;
    },
    async create(wallet: Wallet) { walletsDb.set(wallet.id, wallet); },
    async save(wallet: Wallet) { walletsDb.set(wallet.id, wallet); },
  };

  const mockEscrowRepo: IEscrowRepository = {
    async findById(id: string) { return escrowsDb.get(id) ?? null; },
    async findByBuyerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.buyerId === id);
    },
    async findBySellerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.sellerId === id);
    },
    async create(escrow: EscrowTransaction) { escrowsDb.set(escrow.id, escrow); },
    async save(escrow: EscrowTransaction) { escrowsDb.set(escrow.id, escrow); },
  };

  const mockLedgerRepo: ITransactionLedgerRepository = {
    async create(entry: TransactionLedger) { ledgersDb.push(entry); },
    async findByWalletId(walletId: string) {
      return ledgersDb.filter((l) => l.walletId === walletId);
    },
  };

  const mockAuditLogger: IAuditLogger = {
    async log() {},
  };

  const mockPaymentGateway: IPaymentGateway = {
    async createOrder(params) {
      return { orderId: 'order_test', amount: params.amount, currency: 'INR' };
    },
    verifyPaymentSignature() { return true; },
    async processRefund() { return { refundId: 'rfnd_test', status: 'processed' }; },
  };

  const mockEscrowQueue: IEscrowQueue = {
    async scheduleAutoRelease() {},
    async cancelAutoRelease() {},
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3003,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
  };

  beforeAll(async () => {
    // Seed buyer wallet with ₹1,000 (100000 paise)
    const buyerWallet = Wallet.create('w-buyer', buyerId);
    buyerWallet.credit(100000);
    walletsDb.set(buyerWallet.id, buyerWallet);

    // Seed seller wallet with ₹0
    const sellerWallet = Wallet.create('w-seller', sellerId);
    walletsDb.set(sellerWallet.id, sellerWallet);

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      escrowRepository: mockEscrowRepo,
      transactionLedgerRepository: mockLedgerRepo,
      auditLogger: mockAuditLogger,
      paymentGateway: mockPaymentGateway,
      escrowQueue: mockEscrowQueue,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdEscrowId = '';

  describe('Full Escrow Lifecycle Flow', () => {
    it('1. POST /api/v1/escrow/create - buyer initiates escrow', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/escrow/create',
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
        payload: {
          sellerId,
          type: 'DIGITAL_GOODS',
          amount: 50000, // ₹500
          metadata: { item: 'Valorant Radiant Account' },
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('INITIATED');
      expect(json.data.amount).toBe(50000);
      expect(json.data.platformFee).toBe(2500); // 5%

      createdEscrowId = json.data.id;
    });

    it('2. POST /api/v1/escrow/:id/fund - buyer funds escrow from wallet', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/escrow/${createdEscrowId}/fund`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('FUNDED_IN_ESCROW');

      // Verify buyer wallet frozen balance is 50000 paise
      const buyerWallet = walletsDb.get('w-buyer')!;
      expect(buyerWallet.availableBalance).toBe(50000);
      expect(buyerWallet.frozenBalance).toBe(50000);
    });

    it('3. POST /api/v1/escrow/:id/transition - seller delivers item', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/escrow/${createdEscrowId}/transition`,
        headers: {
          authorization: `Bearer mock-token-${sellerId}`,
        },
        payload: {
          targetState: 'DELIVERED',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('DELIVERED');
    });

    it('4. POST /api/v1/escrow/:id/transition - starts inspection window', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/escrow/${createdEscrowId}/transition`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
        payload: {
          targetState: 'INSPECTION_PERIOD',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('INSPECTION_PERIOD');
      expect(json.data.inspectionDeadline).toBeDefined();
    });

    it('5. POST /api/v1/escrow/:id/transition - buyer approves & funds release to seller', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/escrow/${createdEscrowId}/transition`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
        payload: {
          targetState: 'RELEASED',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('RELEASED');

      // Seller received net ₹475 (50000 - 2500 fee = 47500 paise)
      const sellerWallet = walletsDb.get('w-seller')!;
      expect(sellerWallet.availableBalance).toBe(47500);
    });

    it('6. GET /api/v1/escrow/:id - retrieves final details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/escrow/${createdEscrowId}`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.id).toBe(createdEscrowId);
      expect(json.data.status).toBe('RELEASED');
    });
  });
});
