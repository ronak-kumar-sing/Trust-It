import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import { DigitalGoodsListing } from '../../src/domain/entities/DigitalGoodsListing.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IDigitalGoodsListingRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IEscrowQueue,
} from '../../src/application/interfaces/index.js';

describe('Digital Goods Marketplace Routes Integration', () => {
  let app: FastifyInstance;

  const buyerId = '66666666-6666-4666-8666-666666666666';
  const sellerId = '77777777-7777-4777-8777-777777777777';

  const listingsDb = new Map<string, DigitalGoodsListing>();
  const escrowsDb = new Map<string, EscrowTransaction>();
  const walletsDb = new Map<string, Wallet>();
  const ledgersDb: TransactionLedger[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      if (id === buyerId) return User.create(buyerId, 'buyer@market.io', null, 'email');
      if (id === sellerId) return User.create(sellerId, 'seller@market.io', null, 'email');
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
    async create(w: Wallet) { walletsDb.set(w.id, w); },
    async save(w: Wallet) { walletsDb.set(w.id, w); },
  };

  const mockEscrowRepo: IEscrowRepository = {
    async findById(id: string) { return escrowsDb.get(id) ?? null; },
    async findByBuyerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.buyerId === id);
    },
    async findBySellerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.sellerId === id);
    },
    async create(e: EscrowTransaction) { escrowsDb.set(e.id, e); },
    async save(e: EscrowTransaction) { escrowsDb.set(e.id, e); },
  };

  const mockListingRepo: IDigitalGoodsListingRepository = {
    async findById(id: string) { return listingsDb.get(id) ?? null; },
    async findAll(filter) {
      let all = Array.from(listingsDb.values());
      if (filter?.status) {
        all = all.filter((l) => l.status === filter.status);
      }
      return all;
    },
    async create(l: DigitalGoodsListing) { listingsDb.set(l.id, l); },
    async update(l: DigitalGoodsListing) { listingsDb.set(l.id, l); },
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

  const mockEscrowQueue: IEscrowQueue = {
    async scheduleAutoRelease() {},
    async cancelAutoRelease() {},
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3004,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
  };

  beforeAll(async () => {
    // Buyer has ₹2,000 (200000 paise)
    const buyerWallet = Wallet.create('w-buyer-dg', buyerId);
    buyerWallet.credit(200000);
    walletsDb.set(buyerWallet.id, buyerWallet);

    // Seller has ₹0
    const sellerWallet = Wallet.create('w-seller-dg', sellerId);
    walletsDb.set(sellerWallet.id, sellerWallet);

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      escrowRepository: mockEscrowRepo,
      digitalGoodsListingRepository: mockListingRepo,
      transactionLedgerRepository: mockLedgerRepo,
      auditLogger: mockAuditLogger,
      escrowQueue: mockEscrowQueue,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdListingId = '';

  describe('Digital Goods End-to-End Flow', () => {
    it('1. POST /api/v1/digital-goods/listings - seller creates listing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/digital-goods/listings',
        headers: {
          authorization: `Bearer mock-token-${sellerId}`,
        },
        payload: {
          title: 'Fortnite Black Knight & OG Skull Trooper Account',
          description: 'Full email access, linkable to Xbox and PlayStation',
          price: 100000, // ₹1,000.00
          category: 'GAMING_ACCOUNT',
          insuranceOpted: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('ACTIVE');
      expect(json.data.price).toBe(100000);
      createdListingId = json.data.id;
    });

    it('2. GET /api/v1/digital-goods/listings - lists active marketplace goods', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/digital-goods/listings',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data[0].id).toBe(createdListingId);
    });

    it('3. GET /api/v1/digital-goods/listings/:id - fetches listing details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/digital-goods/listings/${createdListingId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.title).toContain('Fortnite');
    });

    it('4. POST /api/v1/digital-goods/listings/:id/buy - buyer purchases listing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/digital-goods/listings/${createdListingId}/buy`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.listing.status).toBe('SOLD');
      expect(json.data.escrow.status).toBe('FUNDED_IN_ESCROW');

      // Verify buyer balance frozen
      const buyerWallet = walletsDb.get('w-buyer-dg')!;
      expect(buyerWallet.availableBalance).toBe(100000); // 200000 - 100000
      expect(buyerWallet.frozenBalance).toBe(100000);
    });

    it('5. POST /api/v1/digital-goods/listings/:id/deliver - seller submits delivery', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/digital-goods/listings/${createdListingId}/deliver`,
        headers: {
          authorization: `Bearer mock-token-${sellerId}`,
        },
        payload: {
          credentialsOrPayload: 'login: epic_player@mail.com / pass: Secret123!',
          instructions: 'Login to Epic Games, change 2FA phone immediately.',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('INSPECTION_PERIOD');
      expect(json.data.inspectionDeadline).toBeDefined();
    });

    it('6. POST /api/v1/digital-goods/listings/:id/approve - buyer approves delivery', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/digital-goods/listings/${createdListingId}/approve`,
        headers: {
          authorization: `Bearer mock-token-${buyerId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.status).toBe('RELEASED');

      // Verify seller received net funds (₹1,000 - 5% fee = ₹950 = 95000 paise)
      const sellerWallet = walletsDb.get('w-seller-dg')!;
      expect(sellerWallet.availableBalance).toBe(95000);
    });
  });
});
