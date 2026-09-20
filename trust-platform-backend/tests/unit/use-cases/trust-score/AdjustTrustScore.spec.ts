import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdjustTrustScore } from '../../../../src/application/use-cases/trust-score/AdjustTrustScore.js';
import { User } from '../../../../src/domain/entities/User.js';
import { KycStatus } from '../../../../src/domain/enums/index.js';
import { NotFoundError } from '../../../../src/shared/errors/index.js';
import type { IUserRepository, IAuditLogger } from '../../../../src/application/interfaces/index.js';

describe('AdjustTrustScore Use Case', () => {
  let userRepo: IUserRepository;
  let auditLogger: IAuditLogger;
  let adjustTrustScore: AdjustTrustScore;
  let testUser: User;

  beforeEach(() => {
    testUser = User.create({
      id: 'usr_trust_test_1',
      email: 'trust@example.com',
      displayName: 'Trust User',
      trustScore: 50,
      kycStatus: KycStatus.NOT_VERIFIED,
    });

    userRepo = {
      findById: vi.fn(async (id: string) => (id === testUser.id ? testUser : null)),
      findByEmail: vi.fn(async () => null),
      create: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };

    auditLogger = {
      log: vi.fn(async () => {}),
    };

    adjustTrustScore = new AdjustTrustScore(userRepo, auditLogger);
  });

  it('adjusts user trust score for COMPLETED_ESCROW (+5) and persists update', async () => {
    const result = await adjustTrustScore.execute({
      userId: testUser.id,
      adjustmentType: 'COMPLETED_ESCROW',
      referenceId: 'escrow_123',
    });

    expect(result.score).toBe(55);
    expect(result.tier).toBe('BRONZE');
    expect(userRepo.update).toHaveBeenCalledWith(testUser);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'user',
        entityId: testUser.id,
        action: 'TRUST_SCORE_ADJUSTED',
        actorId: 'SYSTEM_TRUST_ENGINE',
        metadata: expect.objectContaining({
          adjustmentType: 'COMPLETED_ESCROW',
          previousScore: 50,
          newScore: 55,
          referenceId: 'escrow_123',
        }),
      }),
    );
  });

  it('adjusts tier when score crosses boundary (e.g. 58 + 5 = 63 -> SILVER)', async () => {
    testUser.updateTrustScore(58);

    const result = await adjustTrustScore.execute({
      userId: testUser.id,
      adjustmentType: 'COMPLETED_ESCROW',
    });

    expect(result.score).toBe(63);
    expect(result.tier).toBe('SILVER');
    expect(result.nextTier).toBe('GOLD');
    expect(result.pointsToNextTier).toBe(17);
  });

  it('throws NotFoundError when user does not exist', async () => {
    await expect(
      adjustTrustScore.execute({
        userId: 'usr_nonexistent',
        adjustmentType: 'COMPLETED_ESCROW',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
