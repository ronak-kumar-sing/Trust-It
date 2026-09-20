import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateKycStatus } from '../../../../src/application/use-cases/auth/UpdateKycStatus.js';
import type { IUserRepository } from '../../../../src/application/interfaces/IUserRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { NotFoundError, IllegalStateTransitionError } from '../../../../src/shared/errors/index.js';
import { User } from '../../../../src/domain/entities/User.js';

describe('UpdateKycStatus Use Case', () => {
  let userRepo: IUserRepository;
  let auditLogger: IAuditLogger;
  let useCase: UpdateKycStatus;
  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    userRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByPhone: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateKycStatus(userRepo, auditLogger);
  });

  it('transitions UNVERIFIED -> PENDING with audit log', async () => {
    const user = User.create(userId, 'user@example.com', null, 'email');
    vi.mocked(userRepo.findById).mockResolvedValue(user);

    const result = await useCase.execute({
      userId,
      targetStatus: 'PENDING',
      actorId: 'admin-1',
    });

    expect(result.kycStatus).toBe('PENDING');
    expect(result.isKycVerified).toBe(false);
    expect(userRepo.update).toHaveBeenCalledWith(user);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'user',
        entityId: userId,
        action: 'KYC_TRANSITION:UNVERIFIED→PENDING',
        actorId: 'admin-1',
      }),
    );
  });

  it('transitions PENDING -> VERIFIED and increases trust score by 15 points', async () => {
    const user = User.create(userId, 'user@example.com', null, 'email');
    user.transitionKycStatus('PENDING');
    const initialScore = user.trustScore; // 50
    vi.mocked(userRepo.findById).mockResolvedValue(user);

    const result = await useCase.execute({
      userId,
      targetStatus: 'VERIFIED',
      actorId: 'admin-1',
    });

    expect(result.kycStatus).toBe('VERIFIED');
    expect(result.isKycVerified).toBe(true);
    expect(result.trustScore).toBe(initialScore + 15);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'KYC_TRANSITION:PENDING→VERIFIED',
      }),
    );
  });

  it('throws IllegalStateTransitionError for illegal transitions', async () => {
    const user = User.create(userId, 'user@example.com', null, 'email');
    vi.mocked(userRepo.findById).mockResolvedValue(user);

    await expect(
      useCase.execute({
        userId,
        targetStatus: 'VERIFIED',
        actorId: 'admin-1',
      }),
    ).rejects.toThrow(IllegalStateTransitionError);
  });

  it('throws NotFoundError if user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'non-existent',
        targetStatus: 'PENDING',
        actorId: 'admin-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
