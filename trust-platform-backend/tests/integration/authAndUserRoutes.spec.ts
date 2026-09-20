import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import type {
  IUserRepository,
  IWalletRepository,
  IAuditLogger,
  AuditEvent,
} from '../../src/application/interfaces/index.js';

describe('Auth & User Routes Integration', () => {
  let app: FastifyInstance;

  // In-memory mock repositories
  const usersDb = new Map<string, User>();
  const walletsDb = new Map<string, Wallet>();
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

  beforeAll(async () => {
    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      auditLogger: mockAuditLogger,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUserId = '22222222-2222-4222-8222-222222222222';

  describe('POST /api/v1/auth/register', () => {
    it('registers a user and returns 201 with profile and initial wallet', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          id: testUserId,
          email: 'testuser@trustvault.io',
          displayName: 'Test Operator',
          authProvider: 'email',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testUserId);
      expect(json.data.displayName).toBe('Test Operator');
      expect(json.data.availableBalance).toBe(0);
      expect(json.data.walletId).toBeDefined();

      // Verify persistence in mock repository
      expect(usersDb.has(testUserId)).toBe(true);
    });

    it('returns 409 Conflict when registering an already registered ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          id: testUserId,
          email: 'another@trustvault.io',
          authProvider: 'email',
        },
      });

      expect(response.statusCode).toBe(409);
      const json = JSON.parse(response.body);
      expect(json.error.error).toBe('CONFLICT');
    });

    it('returns 400 Validation Error if input is missing email and phone', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          id: '33333333-3333-4333-8333-333333333333',
          authProvider: 'email',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 Unauthorized without Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 200 with profile using mock test token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testUserId);
      expect(json.data.displayName).toBe('Test Operator');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns public profile for existing user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${testUserId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.id).toBe(testUserId);
    });

    it('returns 404 for non-existent user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/99999999-9999-4999-8999-999999999999',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('updates user display name and avatar', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          displayName: 'Updated Operator',
          avatarUrl: 'https://cdn.trustvault.io/avatar.png',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.displayName).toBe('Updated Operator');
      expect(json.data.avatarUrl).toBe('https://cdn.trustvault.io/avatar.png');
    });
  });

  describe('PUT /api/v1/users/:id/kyc-status', () => {
    it('transitions KYC status to PENDING, then to VERIFIED and awards trust score bonus', async () => {
      // 1. Transition to PENDING
      const resPending = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${testUserId}/kyc-status`,
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          targetStatus: 'PENDING',
        },
      });

      expect(resPending.statusCode).toBe(200);
      const jsonPending = JSON.parse(resPending.body);
      expect(jsonPending.data.kycStatus).toBe('PENDING');

      // 2. Transition to VERIFIED
      const resVerified = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${testUserId}/kyc-status`,
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          targetStatus: 'VERIFIED',
        },
      });

      expect(resVerified.statusCode).toBe(200);
      const jsonVerified = JSON.parse(resVerified.body);
      expect(jsonVerified.data.kycStatus).toBe('VERIFIED');
      expect(jsonVerified.data.isKycVerified).toBe(true);
      expect(jsonVerified.data.trustScore).toBe(65); // 50 + 15
    });

    it('returns 422 for illegal KYC transition from VERIFIED', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${testUserId}/kyc-status`,
        headers: {
          authorization: `Bearer mock-token-${testUserId}`,
        },
        payload: {
          targetStatus: 'PENDING',
        },
      });

      expect(response.statusCode).toBe(422);
      const json = JSON.parse(response.body);
      expect(json.error.error).toBe('ILLEGAL_STATE_TRANSITION');
    });
  });
});
