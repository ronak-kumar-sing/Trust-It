import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  GetUserProfile,
  UpdateProfile,
  UpdateKycStatus,
} from '../../application/use-cases/auth/index.js';
import {
  UpdateProfileSchema,
  UpdateKycStatusSchema,
  UserIdParamSchema,
} from '../validators/authValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling user resource management, profile updates, and KYC verification.
 */
export function createUserController(
  getUserProfile: GetUserProfile,
  updateProfile: UpdateProfile,
  updateKycStatus: UpdateKycStatus,
) {
  return {
    /**
     * GET /users/:id
     * Returns a user profile by UUID.
     */
    async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = UserIdParamSchema.parse(request.params);
      const profile = await getUserProfile.execute(params.id);

      await reply.status(200).send({
        success: true,
        data: profile,
      });
    },

    /**
     * PUT /users/profile
     * Updates the authenticated user's profile (display name, avatar).
     */
    async updateProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const body = UpdateProfileSchema.parse(request.body);
      const updated = await updateProfile.execute({
        userId: request.user.id,
        displayName: body.displayName,
        avatarUrl: body.avatarUrl,
      });

      const responseBody = {
        success: true,
        data: updated,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * PUT /users/:id/kyc-status
     * Updates the KYC status of a user.
     */
    async updateKycStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = UserIdParamSchema.parse(request.params);
      const body = UpdateKycStatusSchema.parse(request.body);

      const actorId = request.user?.id ?? 'SYSTEM_ADMIN';
      const updated = await updateKycStatus.execute({
        userId: params.id,
        targetStatus: body.targetStatus,
        actorId,
        reason: body.reason,
      });

      const responseBody = {
        success: true,
        data: updated,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },
  };
}
