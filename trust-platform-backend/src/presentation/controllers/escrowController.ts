import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateEscrow,
  FundEscrow,
  TransitionEscrowState,
  DisputeEscrow,
  GetEscrowDetails,
} from '../../application/use-cases/escrow/index.js';
import {
  CreateEscrowSchema,
  TransitionEscrowSchema,
  DisputeEscrowSchema,
  EscrowIdParamSchema,
} from '../validators/escrowValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling escrow transaction lifecycle: initiation, funding, transitions, disputes, and details.
 */
export function createEscrowController(
  createEscrow: CreateEscrow,
  fundEscrow: FundEscrow,
  transitionEscrowState: TransitionEscrowState,
  disputeEscrow: DisputeEscrow,
  getEscrowDetails: GetEscrowDetails,
) {
  return {
    /**
     * POST /escrow/create
     * Creates a new escrow contract.
     */
    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = CreateEscrowSchema.parse(request.body);
      const escrow = await createEscrow.execute({
        buyerId: request.user.id,
        sellerId: body.sellerId,
        type: body.type,
        amount: body.amount,
        metadata: body.metadata,
      });

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },

    /**
     * POST /escrow/:id/fund
     * Locks funds from buyer wallet into escrow.
     */
    async fund(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = EscrowIdParamSchema.parse(request.params);
      const escrow = await fundEscrow.execute({
        escrowTransactionId: params.id,
        buyerId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /escrow/:id/transition
     * Advances escrow state (e.g., to DELIVERED, INSPECTION_PERIOD, RELEASED).
     */
    async transition(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = EscrowIdParamSchema.parse(request.params);
      const body = TransitionEscrowSchema.parse(request.body);

      const escrow = await transitionEscrowState.execute({
        escrowTransactionId: params.id,
        targetState: body.targetState,
        actorId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /escrow/:id/dispute
     * Raises a formal dispute during inspection window.
     */
    async dispute(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = EscrowIdParamSchema.parse(request.params);
      const body = DisputeEscrowSchema.parse(request.body);

      const escrow = await disputeEscrow.execute({
        escrowTransactionId: params.id,
        buyerId: request.user.id,
        reason: body.reason,
        evidenceUrls: body.evidenceUrls,
      });

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * GET /escrow/:id
     * Retrieves escrow details.
     */
    async getDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = EscrowIdParamSchema.parse(request.params);
      const escrow = await getEscrowDetails.execute(params.id);

      await reply.status(200).send({
        success: true,
        data: escrow,
      });
    },
  };
}
