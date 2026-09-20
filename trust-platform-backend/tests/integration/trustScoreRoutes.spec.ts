import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IAuditLogger,
  AuditEvent,
} from '../../src/application/interfaces/index.js';

describe('Trust Score Routes & Tier Limiting Integration', () => {
  let app: FastifyInstance;

  const usersDb = new Map<string, User>();
  const walletsDb = new Map<string, Wallet>();
  const escrowsDb = new Map<string, EscrowTransaction>();
  const auditLogs: AuditEvent[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      return usersDb.get(id) ?? null;
    },
    async findByEmail(email: string) {
      for (const u of usersDb.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    async findByPhone(phone: string) {
      for (const u of usersDb.values()) {
        if (u.phone === phone) return u;
      }
      return null;
    },
    async create(user: User) {
      usersDb.set(user.id, user);
    },
    async update(user: User) {
      usersDb.set(user.id, user);
    },
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

  const mockEscrowRepo: IEscrowRepository = {
    async findById(id: string) {
      return escrowsDb.get(id) ?? null;
    },
    async findByBuyerId(buyerId: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.buyerId === buyerId);
    },
    async findBySellerId(sellerId: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.sellerId === sellerId);
    },
    async create(escrow: EscrowTransaction) {
      escrowsDb.set(escrow.id, escrow);
    },
    async save(escrow: EscrowTransaction) {
      escrowsDb.set(escrow.id, escrow);
    },
  };

  const mockAuditLogger: IAuditLogger = {
    async log(event: AuditEvent) {
      auditLogs.push(event);
    },
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
    RAZORPAY_KEY_ID: 'mock_rzp_id',
    RAZORPAY_KEY_SECRET: 'mock_rzp_secret',
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const sellerId = '22222222-2222-4222-8222-222222222222';

  beforeAll(async () => {
    // Seed test users
    const user = User.create(userId, 'truster@trustvault.io', null, 'email');
    // Default trust score is 50 (BRONZE)
    usersDb.set(userId, user);

    const seller = User.create(sellerId, 'seller@trustvault.io', null, 'email');
    usersDb.set(sellerId, seller);

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      escrowRepository: mockEscrowRepo,
      auditLogger: mockAuditLogger,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/trust-score/me', () => {
    it('returns 401 Unauthorized without auth header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/trust-score/me',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 with authenticated user trust score and tier details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/trust-score/me',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.userId).toBe(userId);
      expect(json.data.score).toBe(50);
      expect(json.data.tier).toBe('BRONZE');
      expect(json.data.maxEscrowAmount).toBe(2500000); // ₹25,000 in paise
      expect(json.data.nextTier).toBe('SILVER');
      expect(json.data.pointsToNextTier).toBe(10);
    });
  });

  describe('GET /api/v1/trust-score/:userId', () => {
    it('returns 200 for public lookup of a user trust score', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/trust-score/${userId}`,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.tier).toBe('BRONZE');
    });

    it('returns 404 for unknown user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/trust-score/nonexistent-id',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/trust-score/:userId/adjust', () => {
    it('applies score adjustment and advances tier when threshold crossed', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/trust-score/${userId}/adjust`,
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_adjust_1',
        },
        payload: {
          adjustmentType: 'KYC_VERIFIED', // +15 points -> 65 points -> SILVER
          referenceId: 'kyc_verification_proof',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.score).toBe(65);
      expect(json.data.tier).toBe('SILVER');
      expect(json.data.maxEscrowAmount).toBe(10000000); // ₹1,00,000 in paise
      expect(json.data.nextTier).toBe('GOLD');
      expect(json.data.pointsToNextTier).toBe(15);
    });
  });

  describe('POST /api/v1/trust-score/:userId/decay', () => {
    it('applies monthly inactivity decay (-2 points)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/trust-score/${userId}/decay`,
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_decay_1',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.score).toBe(63); // 65 - 2 = 63
      expect(json.data.tier).toBe('SILVER');
    });
  });

  describe('Trust Tier Escrow Limit Enforcement in CreateEscrow', () => {
    it('rejects escrow creation if amount exceeds trust tier maximum limit', async () => {
      // Degrade user to STARTER tier (score 20, max single escrow ₹5,000 = 500,000 paise)
      const user = usersDb.get(userId)!;
      user.updateTrustScore(20);

      // Attempt to create ₹10,000 (1,000,000 paise) escrow
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/escrow/create',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_escrow_overlimit',
        },
        payload: {
          sellerId,
          type: 'DIGITAL_GOODS',
          amount: 1000000, // ₹10,000 (exceeds ₹5,000 limit for STARTER)
        },
      });

      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.body);
      expect(json.error.message).toContain('exceeds your Trust Tier (STARTER) limit of ₹5000');
    });

    it('permits escrow creation when amount is within trust tier limit', async () => {
      // Upgrade user to GOLD tier (score 85, max ₹5,00,000)
      const user = usersDb.get(userId)!;
      user.updateTrustScore(85);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/escrow/create',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_escrow_permitted',
        },
        payload: {
          sellerId,
          type: 'DIGITAL_GOODS',
          amount: 1000000, // ₹10,000
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(1000000);
      expect(json.data.status).toBe('INITIATED');
    });
  });
});
