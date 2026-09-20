import type { FastifyInstance } from 'fastify';
import type { RegisterUser, GetUserProfile } from '../../application/use-cases/auth/index.js';
import { createAuthController } from '../controllers/authController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface AuthRoutesOptions {
  registerUser: RegisterUser;
  getUserProfile: GetUserProfile;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for authentication endpoints.
 * Mounts:
 * - POST /api/v1/auth/register
 * - GET  /api/v1/auth/me
 */
export async function authRoutes(
  fastify: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  const controller = createAuthController(options.registerUser, options.getUserProfile);

  fastify.post('/register', {
    preHandler: async (request, reply) => {
      // If client provides Idempotency-Key, enforce deduplication
      if (request.headers['idempotency-key']) {
        await requireIdempotencyKey(request, reply);
      }
    },
    handler: controller.register,
  });

  fastify.get('/me', {
    preHandler: [options.authenticate],
    handler: controller.getMe,
  });
}
