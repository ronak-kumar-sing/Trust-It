import type { FastifyRequest, FastifyReply } from 'fastify';
import { MissingIdempotencyKeyError } from '../../shared/errors/index.js';

interface CachedResponse {
  statusCode: number;
  payload: unknown;
  headers: Record<string, string>;
  createdAt: number;
}

/** In-memory store for idempotency cache */
const idempotencyStore = new Map<string, CachedResponse>();

/** Default TTL for idempotency records: 24 hours */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Fastify preHandler hook enforcing Idempotency-Key header on mutation requests.
 * Short-circuits with cached response if the key has already been executed.
 */
export async function requireIdempotencyKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const key = (request.headers['idempotency-key'] as string | undefined)?.trim();

  if (!key) {
    throw new MissingIdempotencyKeyError();
  }

  const cached = idempotencyStore.get(key);
  if (cached) {
    // Check if TTL expired
    if (Date.now() - cached.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
      return;
    }

    reply.header('x-cache-idempotent', 'HIT');
    for (const [headerKey, headerVal] of Object.entries(cached.headers)) {
      reply.header(headerKey, headerVal);
    }
    await reply.status(cached.statusCode).send(cached.payload);
  }
}

/**
 * Caches the response for an idempotency key.
 *
 * @param key - The idempotency key
 * @param statusCode - HTTP status code
 * @param payload - Response payload
 * @param headers - Response headers to preserve
 */
export function recordIdempotencyResponse(
  key: string,
  statusCode: number,
  payload: unknown,
  headers: Record<string, string> = {},
): void {
  idempotencyStore.set(key, {
    statusCode,
    payload,
    headers,
    createdAt: Date.now(),
  });
}

/**
 * Clears expired or all keys from the cache.
 */
export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}
