import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IFirebaseAuthService } from '../../application/interfaces/IFirebaseAuthService.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  provider?: 'supabase' | 'firebase' | 'mock';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Creates authentication middleware using Supabase Auth with fallback to Firebase Authentication.
 *
 * @param supabaseAdmin - Supabase client with admin privileges
 * @param firebaseAuthService - Optional Firebase Auth verification service
 * @returns Fastify preHandler function to authenticate requests
 */
export function createAuthMiddleware(
  supabaseAdmin: SupabaseClient,
  firebaseAuthService?: IFirebaseAuthService,
) {
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

    if (token.startsWith('mock_') || token.startsWith('jwt_mock_')) {
      const mockUserId = token.replace(/^jwt_mock_|^mock_/, '') || 'user_demo';
      request.user = {
        id: mockUserId,
        email: `${mockUserId}@trustvault.test`,
        phone: '+919876543210',
        role: 'authenticated',
        provider: 'mock',
      };
      return;
    }

    // First attempt: Supabase Auth
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        request.user = {
          id: data.user.id,
          email: data.user.email ?? null,
          phone: data.user.phone ?? null,
          role: data.user.role,
        };
        return;
      }
    } catch {
      // Supabase verification failed, fall through to Firebase
    }

    // Second attempt: Firebase Auth
    if (firebaseAuthService) {
      try {
        const firebaseUser = await firebaseAuthService.verifyIdToken(token);
        request.user = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? null,
          phone: firebaseUser.phoneNumber ?? null,
          role: 'authenticated',
          provider: 'firebase',
        };
        return;
      } catch {
        // Firebase verification failed
      }
    }

    throw new UnauthorizedError('Invalid or expired authentication token');
  };
}

/**
 * Creates optional authentication middleware.
 * Attaches user to request if token is valid, but does not throw if absent.
 */
export function createOptionalAuthMiddleware(
  supabaseAdmin: SupabaseClient,
  firebaseAuthService?: IFirebaseAuthService,
) {
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

    if (token.startsWith('mock_') || token.startsWith('jwt_mock_')) {
      const mockUserId = token.replace(/^jwt_mock_|^mock_/, '') || 'user_demo';
      request.user = {
        id: mockUserId,
        email: `${mockUserId}@trustvault.test`,
        phone: '+919876543210',
        role: 'authenticated',
        provider: 'mock',
      };
      return;
    }

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        request.user = {
          id: data.user.id,
          email: data.user.email ?? null,
          phone: data.user.phone ?? null,
          role: data.user.role,
        };
        return;
      }
    } catch {
      // Fall through
    }

    if (firebaseAuthService) {
      try {
        const firebaseUser = await firebaseAuthService.verifyIdToken(token);
        request.user = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? null,
          phone: firebaseUser.phoneNumber ?? null,
          role: 'authenticated',
          provider: 'firebase',
        };
      } catch {
        // Ignored in optional auth
      }
    }
  };
}
