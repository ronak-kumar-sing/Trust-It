import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  GetTrustScoreDetails,
  AdjustTrustScore,
  ApplyInactivityDecay,
} from '../../application/use-cases/trust-score/index.js';
import {
  AdjustTrustScoreSchema,
  TrustScoreUserIdParamSchema,
} from '../validators/trustScoreValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling trust score queries, adjustments, and inactivity decay.
 */
export function createTrustScoreController(
  getTrustScoreDetails: GetTrustScoreDetails,
  adjustTrustScore: AdjustTrustScore,
  applyInactivityDecay: ApplyInactivityDecay,
) {
  return {
    /**
     * GET /trust-score/me
     * Returns the authenticated user's trust score and tier analysis.
     */
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const details = await getTrustScoreDetails.execute(request.user.id);
      await reply.status(200).send({
        success: true,
        data: details,
      });
    },

    /**
     * GET /trust-score/:userId
     * Returns trust score and tier analysis for a specific user ID.
     */
    async getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = TrustScoreUserIdParamSchema.parse(request.params);
      const details = await getTrustScoreDetails.execute(params.userId);

      await reply.status(200).send({
        success: true,
        data: details,
      });
    },

    /**
     * POST /trust-score/:userId/adjust
     * Admin/System endpoint to apply a calibrated trust score adjustment.
     */
    async adjust(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = TrustScoreUserIdParamSchema.parse(request.params);
      const body = AdjustTrustScoreSchema.parse(request.body);

      const result = await adjustTrustScore.execute({
        userId: params.userId,
        adjustmentType: body.adjustmentType,
        referenceId: body.referenceId,
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
     * POST /trust-score/:userId/decay
     * System endpoint to apply monthly inactivity decay (-2 points).
     */
    async applyDecay(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = TrustScoreUserIdParamSchema.parse(request.params);
      const result = await applyInactivityDecay.execute(params.userId);

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
