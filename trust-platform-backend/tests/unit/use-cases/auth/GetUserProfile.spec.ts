import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUserProfile } from '../../../../src/application/use-cases/auth/GetUserProfile.js';
import type { IUserRepository } from '../../../../src/application/interfaces/IUserRepository.js';
import { NotFoundError } from '../../../../src/shared/errors/index.js';
import { User } from '../../../../src/domain/entities/User.js';

describe('GetUserProfile Use Case', () => {
  let userRepo: IUserRepository;
  let useCase: GetUserProfile;
  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    userRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByPhone: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new GetUserProfile(userRepo);
  });

  it('retrieves an existing user profile by ID', async () => {
    const user = User.create(userId, 'user@example.com', '+919876543210', 'phone');
    user.updateDisplayName('Test User');
    vi.mocked(userRepo.findById).mockResolvedValue(user);

    const result = await useCase.execute(userId);

    expect(result.id).toBe(userId);
    expect(result.displayName).toBe('Test User');
    expect(result.email).toBe('user@example.com');
    expect(result.phone).toBe('+919876543210');
    expect(result.kycStatus).toBe('UNVERIFIED');
    expect(result.isKycVerified).toBe(false);
    expect(result.trustScore).toBe(50);
  });

  it('throws NotFoundError if user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute(userId)).rejects.toThrow(NotFoundError);
  });
});
