import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RegisterUser, GetUserProfile } from '../../application/use-cases/auth/index.js';
import { RegisterUserSchema } from '../validators/authValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling authentication and self-identity endpoints.
 */
export function createAuthController(
  registerUser: RegisterUser,
  getUserProfile: GetUserProfile,
) {
  return {
    /**
     * POST /auth/register
     * Registers a new platform user and initializes their wallet.
     */
    async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const validated = RegisterUserSchema.parse(request.body);

      const result = await registerUser.execute({
        id: validated.id,
        email: validated.email,
        phone: validated.phone,
        displayName: validated.displayName,
        authProvider: validated.authProvider,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },

    /**
     * GET /auth/me
     * Returns the currently authenticated user's profile.
     */
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User is not authenticated');
      }

      const profile = await getUserProfile.execute(request.user.id);

      await reply.status(200).send({
        success: true,
        data: profile,
      });
    },
  };
}
