import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { FirebaseStorageService } from '../../src/infrastructure/storage/FirebaseStorageService.js';

describe('Storage Routes Integration', () => {
  let app: FastifyInstance;
  const storageService = new FirebaseStorageService('test-bucket.appspot.com');
  const userId = 'usr_storage_tester_1';

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3002,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
  };

  beforeAll(async () => {
    app = await buildApp(testConfig, {
      storageService,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates upload ticket for KYC document when authenticated', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/storage/upload-ticket',
      headers: {
        authorization: `Bearer mock-token-${userId}`,
      },
      payload: {
        filename: 'aadhaar_front.pdf',
        contentType: 'application/pdf',
        purpose: 'KYC',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.uploadUrl).toBeDefined();
    expect(body.data.fileUrl).toBeDefined();
    expect(body.data.storagePath).toContain(`kyc/${userId}/`);
    expect(body.data.purpose).toBe('KYC');
  });

  it('generates upload ticket for dispute evidence with escrowId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/storage/upload-ticket',
      headers: {
        authorization: `Bearer mock-token-${userId}`,
      },
      payload: {
        filename: 'unboxing_defect.mp4',
        contentType: 'video/mp4',
        purpose: 'DISPUTE_EVIDENCE',
        escrowId: 'escrow_999',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.storagePath).toContain('disputes/escrow_999/');
  });

  it('rejects upload ticket request without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/storage/upload-ticket',
      payload: {
        filename: 'test.pdf',
        contentType: 'application/pdf',
        purpose: 'KYC',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('generates a secure signed download link when authenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/storage/download-link?filePath=kyc/user_1/doc.pdf',
      headers: {
        authorization: `Bearer mock-token-${userId}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.downloadUrl).toBeDefined();
    expect(body.data.filePath).toBe('kyc/user_1/doc.pdf');
  });
});
