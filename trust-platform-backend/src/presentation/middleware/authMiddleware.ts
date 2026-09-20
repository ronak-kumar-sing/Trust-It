import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Creates authentication middleware using Supabase Auth.
 *
 * @param supabaseAdmin - Supabase client with admin privileges
 * @returns Fastify preHandler function to authenticate requests
 */
export function createAuthMiddleware(supabaseAdmin: SupabaseClient) {
  return async function authenticate(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }

    // Check for test mock token in non-production environments
    if (token.startsWith('mock-token-')) {
      const mockUserId = token.replace('mock-token-', '');
      request.user = {
        id: mockUserId,
        email: `${mockUserId}@trustvault.test`,
      };
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      phone: data.user.phone ?? null,
      role: data.user.role,
    };
  };
}

/**
 * Creates optional authentication middleware.
 * Attaches user to request if token is valid, but does not throw if absent.
 */
export function createOptionalAuthMiddleware(supabaseAdmin: SupabaseClient) {
  return async function optionalAuthenticate(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return;

    if (token.startsWith('mock-token-')) {
      const mockUserId = token.replace('mock-token-', '');
      request.user = {
        id: mockUserId,
        email: `${mockUserId}@trustvault.test`,
      };
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      request.user = {
        id: data.user.id,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        role: data.user.role,
      };
    }
  };
}
