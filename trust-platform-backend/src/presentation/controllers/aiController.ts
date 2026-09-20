import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  VerifyDigitalCredentials,
  AssessGhostingRisk,
} from '../../application/use-cases/ai/index.js';
import {
  VerifyCredentialsSchema,
  AssessGhostingSchema,
} from '../validators/aiValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';

/**
 * Controller handling AI verification and risk prediction services.
 */
export function createAiController(
  verifyDigitalCredentials: VerifyDigitalCredentials,
  assessGhostingRisk: AssessGhostingRisk,
) {
  return {
    /**
     * POST /ai/verify-credentials
     * Verifies digital goods delivery payload or credentials.
     */
    async verifyCredentials(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      const body = VerifyCredentialsSchema.parse(request.body);
      const actorId = request.user?.id ?? 'ANONYMOUS_CHECKER';

      const result = await verifyDigitalCredentials.execute({
        category: body.category,
        payload: body.payload,
        listingId: body.listingId,
        actorId,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /ai/assess-ghosting
     * Evaluates counterparty response lag and predicts abandonment risk.
     */
    async assessGhosting(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      const body = AssessGhostingSchema.parse(request.body);
      const actorId = request.user?.id ?? 'SYSTEM_SENTINEL';

      const result = await assessGhostingRisk.execute({
        userId: body.userId,
        lastActivityAt: new Date(body.lastActivityAt),
        pendingMilestoneCount: body.pendingMilestoneCount,
        daysUntilDeadline: body.daysUntilDeadline,
        actorId,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },
  };
}
