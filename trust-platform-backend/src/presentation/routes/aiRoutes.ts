import type { FastifyInstance } from 'fastify';
import type {
  VerifyDigitalCredentials,
  AssessGhostingRisk,
} from '../../application/use-cases/ai/index.js';
import { createAiController } from '../controllers/aiController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface AiRoutesOptions {
  verifyDigitalCredentials: VerifyDigitalCredentials;
  assessGhostingRisk: AssessGhostingRisk;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for AI verification and predictive intelligence.
 * Mounts:
 * - POST /api/v1/ai/verify-credentials
 * - POST /api/v1/ai/assess-ghosting
 */
export async function aiRoutes(
  fastify: FastifyInstance,
  options: AiRoutesOptions,
): Promise<void> {
  const controller = createAiController(
    options.verifyDigitalCredentials,
    options.assessGhostingRisk,
  );

  fastify.post('/verify-credentials', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.verifyCredentials,
  });

  fastify.post('/assess-ghosting', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.assessGhosting,
  });
}
