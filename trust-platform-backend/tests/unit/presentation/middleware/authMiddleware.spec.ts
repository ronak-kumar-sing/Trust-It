import { describe, it, expect, vi } from 'vitest';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from '../../../../src/presentation/middleware/authMiddleware.js';
import { UnauthorizedError } from '../../../../src/shared/errors/index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('Auth Middleware', () => {
  const mockSupabaseAdmin = {
    auth: {
      getUser: vi.fn(),
    },
  } as any;

  const authMiddleware = createAuthMiddleware(mockSupabaseAdmin);
  const optionalAuthMiddleware = createOptionalAuthMiddleware(mockSupabaseAdmin);

  const mockReply = {} as FastifyReply;

  it('throws UnauthorizedError if Authorization header is missing', async () => {
    const request = { headers: {} } as FastifyRequest;

    await expect(authMiddleware(request, mockReply)).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError if Authorization header does not start with Bearer', async () => {
    const request = {
      headers: { authorization: 'Basic 12345' },
    } as unknown as FastifyRequest;

    await expect(authMiddleware(request, mockReply)).rejects.toThrow(UnauthorizedError);
  });

  it('authenticates mock test token in test environments', async () => {
    const request = {
      headers: { authorization: 'Bearer mock-token-user-123' },
    } as unknown as FastifyRequest;

    await authMiddleware(request, mockReply);
    expect(request.user).toEqual({
      id: 'user-123',
      email: 'user-123@trustvault.test',
    });
  });

  it('authenticates valid Supabase token', async () => {
    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-real-456',
          email: 'real@example.com',
          phone: '+919876543210',
          role: 'authenticated',
        },
      },
      error: null,
    });

    const request = {
      headers: { authorization: 'Bearer valid-jwt-token' },
    } as unknown as FastifyRequest;

    await authMiddleware(request, mockReply);
    expect(request.user).toEqual({
      id: 'user-real-456',
      email: 'real@example.com',
      phone: '+919876543210',
      role: 'authenticated',
    });
  });

  it('throws UnauthorizedError when Supabase returns error', async () => {
    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'token expired' },
    });

    const request = {
      headers: { authorization: 'Bearer expired-jwt-token' },
    } as unknown as FastifyRequest;

    await expect(authMiddleware(request, mockReply)).rejects.toThrow(UnauthorizedError);
  });

  it('optionalAuth does not throw when Authorization header is absent', async () => {
    const request = { headers: {} } as FastifyRequest;

    await optionalAuthMiddleware(request, mockReply);
    expect(request.user).toBeUndefined();
  });
});
