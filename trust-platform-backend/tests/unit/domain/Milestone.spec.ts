import { describe, it, expect } from 'vitest';
import { Milestone } from '../../../src/domain/entities/Milestone.js';
import {
  ValidationError,
  InvalidAmountError,
  IllegalStateTransitionError,
} from '../../../src/shared/errors/index.js';

describe('Milestone Entity', () => {
  const projectId = 'proj-12345';

  it('creates a milestone with valid inputs', () => {
    const milestone = Milestone.create({
      projectId,
      title: 'Milestone 1: Backend Architecture',
      description: 'Setup database and auth',
      amount: 50000,
      sowText: 'Deliver Clean Architecture setup',
    });

    expect(milestone.id).toBeDefined();
    expect(milestone.projectId).toBe(projectId);
    expect(milestone.title).toBe('Milestone 1: Backend Architecture');
    expect(milestone.amount).toBe(50000);
    expect(milestone.status).toBe('PENDING');
    expect(milestone.revisionCount).toBe(0);
    expect(milestone.escrowTransactionId).toBeNull();
  });

  it('rejects invalid title or amount', () => {
    expect(() =>
      Milestone.create({
        projectId,
        title: 'ab',
        amount: 50000,
      }),
    ).toThrow(ValidationError);

    expect(() =>
      Milestone.create({
        projectId,
        title: 'Valid Title',
        amount: -100,
      }),
    ).toThrow(InvalidAmountError);
  });

  it('progresses through valid lifecycle: PENDING -> FUNDED -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> RELEASED', () => {
    const milestone = Milestone.create({
      projectId,
      title: 'Design UI',
      amount: 40000,
    });

    milestone.fund('escrow-999');
    expect(milestone.status).toBe('FUNDED');
    expect(milestone.escrowTransactionId).toBe('escrow-999');

    milestone.startWork();
    expect(milestone.status).toBe('IN_PROGRESS');

    milestone.submitDeliverable('https://github.com/example/repo');
    expect(milestone.status).toBe('SUBMITTED');
    expect(milestone.submissionUrl).toBe('https://github.com/example/repo');

    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    milestone.triggerQualityGate({ score: 95, passed: true }, deadline);
    expect(milestone.status).toBe('UNDER_REVIEW');
    expect(milestone.qualityGateResult).toEqual({ score: 95, passed: true });
    expect(milestone.reviewDeadline).toEqual(deadline);

    milestone.approve();
    expect(milestone.status).toBe('APPROVED');

    milestone.release();
    expect(milestone.status).toBe('RELEASED');
  });

  it('enforces maximum 3 revision rounds strictly', () => {
    const milestone = Milestone.create({
      projectId,
      title: 'API Integration',
      amount: 60000,
    });

    milestone.fund('escrow-123');
    milestone.startWork();
    milestone.submitDeliverable('https://github.com/example/api');
    milestone.triggerQualityGate({ score: 90 }, new Date());

    // Round 1
    milestone.requestChanges();
    expect(milestone.revisionCount).toBe(1);
    expect(milestone.status).toBe('CHANGES_REQUESTED');

    milestone.submitDeliverable('https://github.com/example/api-rev1');
    milestone.triggerQualityGate({ score: 92 }, new Date());

    // Round 2
    milestone.requestChanges();
    expect(milestone.revisionCount).toBe(2);
    expect(milestone.status).toBe('CHANGES_REQUESTED');

    milestone.submitDeliverable('https://github.com/example/api-rev2');
    milestone.triggerQualityGate({ score: 93 }, new Date());

    // Round 3
    milestone.requestChanges();
    expect(milestone.revisionCount).toBe(3);
    expect(milestone.status).toBe('CHANGES_REQUESTED');

    milestone.submitDeliverable('https://github.com/example/api-rev3');
    milestone.triggerQualityGate({ score: 94 }, new Date());

    // Round 4 attempt MUST fail with ValidationError
    expect(() => milestone.requestChanges()).toThrow(ValidationError);
  });

  it('throws IllegalStateTransitionError on out-of-order calls', () => {
    const milestone = Milestone.create({
      projectId,
      title: 'Test',
      amount: 10000,
    });

    expect(() => milestone.approve()).toThrow(IllegalStateTransitionError);
    expect(() => milestone.startWork()).toThrow(IllegalStateTransitionError);
  });
});
