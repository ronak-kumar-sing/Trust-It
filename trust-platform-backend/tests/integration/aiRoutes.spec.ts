import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { CredentialVerifierStub } from '../../src/infrastructure/ai/CredentialVerifierStub.js';
import { GhostingPredictorStub } from '../../src/infrastructure/ai/GhostingPredictorStub.js';
import type {
  IUserRepository,
  IAuditLogger,
  AuditEvent,
} from '../../src/application/interfaces/index.js';

describe('AI Routes Integration', () => {
  let app: FastifyInstance;

  const usersDb = new Map<string, User>();
  const auditLogs: AuditEvent[] = [];
  const userId = '55555555-5555-4555-8555-555555555555';

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      return usersDb.get(id) ?? null;
    },
    async findByEmail() { return null; },
    async findByPhone() { return null; },
    async create() {},
    async update() {},
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

  const mockNotificationRepo = {
    async create() {},
    async findById() { return null; },
    async findByUserId() { return []; },
    async markAsRead() { return null; },
    async markAllAsRead() { return 0; },
    async getUnreadCount() { return 0; },
  };

  beforeAll(async () => {
    const user = User.create(userId, 'ai_tester@trustvault.io', null, 'email');
    usersDb.set(userId, user);

    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      credentialVerifier: new CredentialVerifierStub(),
      ghostingPredictor: new GhostingPredictorStub(),
      auditLogger: mockAuditLogger,
      notificationRepository: mockNotificationRepo as any,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/ai/verify-credentials', () => {
    it('returns 401 without authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/verify-credentials',
        payload: {
          category: 'STREAMING_ACCOUNT',
          payload: 'test:password',
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('verifies valid credential payload and returns 200 with report', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/verify-credentials',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_ai_verify_1',
        },
        payload: {
          category: 'STREAMING_ACCOUNT',
          payload: 'user@netflix.com:secretPassword123',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.isValid).toBe(true);
      expect(json.data.confidence).toBeGreaterThan(0.9);
      expect(json.data.details.riskScore).toBeLessThan(10);
    });
  });

  describe('POST /api/v1/ai/assess-ghosting', () => {
    it('assesses ghosting risk based on user inactivity and returns 200', async () => {
      const fiveDaysAgo = new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString();

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/assess-ghosting',
        headers: {
          authorization: `Bearer mock-token-${userId}`,
          'idempotency-key': 'idem_ai_ghost_1',
        },
        payload: {
          userId,
          lastActivityAt: fiveDaysAgo,
          pendingMilestoneCount: 1,
          daysUntilDeadline: 1,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.riskScore).toBeGreaterThan(0);
      expect(json.data.recommendedAction).toBeDefined();
      expect(Array.isArray(json.data.reasons)).toBe(true);
    });
  });
});
