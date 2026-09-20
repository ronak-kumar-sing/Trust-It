import type { FastifyInstance } from 'fastify';
import type {
  GetUserProfile,
  UpdateProfile,
  UpdateKycStatus,
} from '../../application/use-cases/auth/index.js';
import { createUserController } from '../controllers/userController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface UserRoutesOptions {
  getUserProfile: GetUserProfile;
  updateProfile: UpdateProfile;
  updateKycStatus: UpdateKycStatus;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for user profile and KYC operations.
 * Mounts:
 * - GET /api/v1/users/:id
 * - PUT /api/v1/users/profile
 * - PUT /api/v1/users/:id/kyc-status
 */
export async function userRoutes(
  fastify: FastifyInstance,
  options: UserRoutesOptions,
): Promise<void> {
  const controller = createUserController(
    options.getUserProfile,
    options.updateProfile,
    options.updateKycStatus,
  );

  // Public user profile lookup
  fastify.get('/:id', {
    handler: controller.getById,
  });

  // Authenticated user profile update
  fastify.put('/profile', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.updateProfile,
  });

  // Admin / Service KYC transition endpoint
  fastify.put('/:id/kyc-status', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.updateKycStatus,
  });
}
