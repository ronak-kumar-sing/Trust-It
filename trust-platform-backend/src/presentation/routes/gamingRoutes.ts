import type { FastifyInstance } from 'fastify';
import type {
  CreateChallenge,
  AcceptChallenge,
  GetChallengeById,
  GetOpenChallenges,
  ReportMatchResult,
  ClaimTimeoutWin,
  ResolveGamingDispute,
  CancelChallenge,
} from '../../application/use-cases/gaming/index.js';
import { createGamingController } from '../controllers/gamingController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface GamingRoutesOptions {
  createChallenge: CreateChallenge;
  acceptChallenge: AcceptChallenge;
  getChallengeById: GetChallengeById;
  getOpenChallenges: GetOpenChallenges;
  reportMatchResult: ReportMatchResult;
  claimTimeoutWin: ClaimTimeoutWin;
  resolveGamingDispute: ResolveGamingDispute;
  cancelChallenge: CancelChallenge;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for gaming wager escrow.
 * Mounts:
 * - POST /api/v1/gaming/challenges
 * - GET  /api/v1/gaming/challenges
 * - GET  /api/v1/gaming/challenges/:id
 * - POST /api/v1/gaming/challenges/:id/accept
 * - POST /api/v1/gaming/challenges/:id/report
 * - POST /api/v1/gaming/challenges/:id/claim-timeout
 * - POST /api/v1/gaming/challenges/:id/resolve
 * - POST /api/v1/gaming/challenges/:id/cancel
 */
export async function gamingRoutes(
  fastify: FastifyInstance,
  options: GamingRoutesOptions,
): Promise<void> {
  const controller = createGamingController(
    options.createChallenge,
    options.acceptChallenge,
    options.getChallengeById,
    options.getOpenChallenges,
    options.reportMatchResult,
    options.claimTimeoutWin,
    options.resolveGamingDispute,
    options.cancelChallenge,
  );

  fastify.post('/challenges', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.create,
  });

  fastify.get('/challenges', {
    handler: controller.listOpen,
  });

  fastify.get('/challenges/:id', {
    handler: controller.getById,
  });

  fastify.post('/challenges/:id/accept', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.accept,
  });

  fastify.post('/challenges/:id/report', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.reportResult,
  });

  fastify.post('/challenges/:id/claim-timeout', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.claimTimeout,
  });

  fastify.post('/challenges/:id/resolve', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.resolveDispute,
  });

  fastify.post('/challenges/:id/cancel', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.cancel,
  });
}
