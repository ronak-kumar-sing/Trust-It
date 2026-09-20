import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProfile } from '../../../../src/application/use-cases/auth/UpdateProfile.js';
import type { IUserRepository } from '../../../../src/application/interfaces/IUserRepository.js';
import { NotFoundError } from '../../../../src/shared/errors/index.js';
import { User } from '../../../../src/domain/entities/User.js';

describe('UpdateProfile Use Case', () => {
  let userRepo: IUserRepository;
  let useCase: UpdateProfile;
  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    userRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByPhone: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateProfile(userRepo);
  });

  it('updates display name and avatar URL', async () => {
    const user = User.create(userId, 'user@example.com', null, 'email');
    vi.mocked(userRepo.findById).mockResolvedValue(user);

    const result = await useCase.execute({
      userId,
      displayName: 'New Name',
      avatarUrl: 'https://cdn.example.com/pic.png',
    });

    expect(result.displayName).toBe('New Name');
    expect(result.avatarUrl).toBe('https://cdn.example.com/pic.png');
    expect(userRepo.update).toHaveBeenCalledWith(user);
  });

  it('throws NotFoundError if user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'non-existent',
        displayName: 'Test',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
