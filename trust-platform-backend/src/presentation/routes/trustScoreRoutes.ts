import type { FastifyInstance } from 'fastify';
import type {
  GetTrustScoreDetails,
  AdjustTrustScore,
  ApplyInactivityDecay,
} from '../../application/use-cases/trust-score/index.js';
import { createTrustScoreController } from '../controllers/trustScoreController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface TrustScoreRoutesOptions {
  getTrustScoreDetails: GetTrustScoreDetails;
  adjustTrustScore: AdjustTrustScore;
  applyInactivityDecay: ApplyInactivityDecay;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for Trust Score and Tier operations.
 * Mounts:
 * - GET  /api/v1/trust-score/me
 * - GET  /api/v1/trust-score/:userId
 * - POST /api/v1/trust-score/:userId/adjust
 * - POST /api/v1/trust-score/:userId/decay
 */
export async function trustScoreRoutes(
  fastify: FastifyInstance,
  options: TrustScoreRoutesOptions,
): Promise<void> {
  const controller = createTrustScoreController(
    options.getTrustScoreDetails,
    options.adjustTrustScore,
    options.applyInactivityDecay,
  );

  // Authenticated user's own trust score details
  fastify.get('/me', {
    preHandler: [options.authenticate],
    handler: controller.getMe,
  });

  // Public/peer trust score lookup
  fastify.get('/:userId', {
    handler: controller.getByUserId,
  });

  // Adjust trust score (system/admin action with idempotency)
  fastify.post('/:userId/adjust', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.adjust,
  });

  // Apply inactivity decay (monthly cron/worker action with idempotency)
  fastify.post('/:userId/decay', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.applyDecay,
  });
}
