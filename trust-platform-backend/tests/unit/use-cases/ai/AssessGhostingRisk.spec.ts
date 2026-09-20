import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessGhostingRisk } from '../../../../src/application/use-cases/ai/AssessGhostingRisk.js';
import { User } from '../../../../src/domain/entities/User.js';
import type {
  IGhostingPredictor,
  IUserRepository,
  IAuditLogger,
} from '../../../../src/application/interfaces/index.js';
import type { SendNotification } from '../../../../src/application/use-cases/notification/SendNotification.js';

describe('AssessGhostingRisk Use Case', () => {
  let predictor: IGhostingPredictor;
  let userRepo: IUserRepository;
  let auditLogger: IAuditLogger;
  let sendNotification: SendNotification;
  let useCase: AssessGhostingRisk;
  let testUser: User;

  beforeEach(() => {
    testUser = User.create('usr_ghost_test', 'ghost@trustvault.io', null, 'email');

    userRepo = {
      findById: vi.fn(async (id: string) => (id === testUser.id ? testUser : null)),
      findByEmail: vi.fn(async () => null),
      findByPhone: vi.fn(async () => null),
      create: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };

    predictor = {
      assessRisk: vi.fn(async () => ({
        riskScore: 80,
        riskLevel: 'CRITICAL',
        daysSinceLastActivity: 11,
        recommendedAction: 'AUTO_ESCALATE',
        reasons: ['Over 10 days inactive'],
      })),
    };

    auditLogger = {
      log: vi.fn(async () => {}),
    };

    sendNotification = {
      execute: vi.fn(async () => ({} as any)),
    } as any;

    useCase = new AssessGhostingRisk(
      predictor,
      auditLogger,
      userRepo,
      sendNotification,
    );
  });

  it('evaluates ghosting risk, logs audit event, and dispatches warning notification on high risk', async () => {
    const result = await useCase.execute({
      userId: testUser.id,
      lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 11),
      pendingMilestoneCount: 2,
    });

    expect(result.riskScore).toBe(80);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'user_inactivity_risk',
        action: 'HIGH_GHOSTING_RISK_DETECTED',
        entityId: testUser.id,
      }),
    );
    expect(sendNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUser.id,
        title: expect.stringContaining('Action Required'),
      }),
    );
  });

  it('does not send warning notification when risk is LOW', async () => {
    vi.mocked(predictor.assessRisk).mockResolvedValueOnce({
      riskScore: 10,
      riskLevel: 'LOW',
      daysSinceLastActivity: 0.5,
      recommendedAction: 'NONE',
      reasons: ['Active recently'],
    });

    const result = await useCase.execute({
      userId: testUser.id,
      lastActivityAt: new Date(),
    });

    expect(result.riskLevel).toBe('LOW');
    expect(auditLogger.log).not.toHaveBeenCalled();
    expect(sendNotification.execute).not.toHaveBeenCalled();
  });
});
