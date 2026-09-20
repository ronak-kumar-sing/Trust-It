import type { FastifyInstance } from 'fastify';
import type {
  CreateEscrow,
  FundEscrow,
  TransitionEscrowState,
  DisputeEscrow,
  GetEscrowDetails,
} from '../../application/use-cases/escrow/index.js';
import { createEscrowController } from '../controllers/escrowController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface EscrowRoutesOptions {
  createEscrow: CreateEscrow;
  fundEscrow: FundEscrow;
  transitionEscrowState: TransitionEscrowState;
  disputeEscrow: DisputeEscrow;
  getEscrowDetails: GetEscrowDetails;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for escrow lifecycle operations.
 * Mounts:
 * - POST /api/v1/escrow/create
 * - POST /api/v1/escrow/:id/fund
 * - POST /api/v1/escrow/:id/transition
 * - POST /api/v1/escrow/:id/dispute
 * - GET  /api/v1/escrow/:id
 */
export async function escrowRoutes(
  fastify: FastifyInstance,
  options: EscrowRoutesOptions,
): Promise<void> {
  const controller = createEscrowController(
    options.createEscrow,
    options.fundEscrow,
    options.transitionEscrowState,
    options.disputeEscrow,
    options.getEscrowDetails,
  );

  fastify.post('/create', {
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

  fastify.post('/:id/fund', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.fund,
  });

  fastify.post('/:id/transition', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.transition,
  });

  fastify.post('/:id/dispute', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.dispute,
  });

  fastify.get('/:id', {
    preHandler: [options.authenticate],
    handler: controller.getDetails,
  });
}
