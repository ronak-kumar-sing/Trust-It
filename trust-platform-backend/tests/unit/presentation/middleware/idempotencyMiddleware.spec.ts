import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requireIdempotencyKey,
  recordIdempotencyResponse,
  clearIdempotencyCache,
} from '../../../../src/presentation/middleware/idempotencyMiddleware.js';
import { MissingIdempotencyKeyError } from '../../../../src/shared/errors/index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('Idempotency Middleware', () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  it('throws MissingIdempotencyKeyError when Idempotency-Key header is missing', async () => {
    const request = { headers: {} } as FastifyRequest;
    const reply = {} as FastifyReply;

    await expect(requireIdempotencyKey(request, reply)).rejects.toThrow(
      MissingIdempotencyKeyError,
    );
  });

  it('allows request to proceed when key is not cached', async () => {
    const request = {
      headers: { 'idempotency-key': 'key-unique-123' },
    } as unknown as FastifyRequest;
    const reply = {} as FastifyReply;

    await expect(requireIdempotencyKey(request, reply)).resolves.toBeUndefined();
  });

  it('short-circuits with cached status and payload on replay', async () => {
    const key = 'key-cached-456';
    const cachedPayload = { success: true, transactionId: 'tx-1' };
    recordIdempotencyResponse(key, 201, cachedPayload, { 'content-type': 'application/json' });

    const request = {
      headers: { 'idempotency-key': key },
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue(undefined),
    } as unknown as FastifyReply;

    await requireIdempotencyKey(request, reply);

    expect(reply.header).toHaveBeenCalledWith('x-cache-idempotent', 'HIT');
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith(cachedPayload);
  });
});
