import { describe, it, expect } from 'vitest';
import { MatchResult } from '../../../src/domain/entities/MatchResult.js';
import { ValidationError } from '../../../src/shared/errors/index.js';

describe('MatchResult Entity', () => {
  const challengeId = 'chal-123';
  const reporterId = 'rep-456';
  const claimedWinnerId = 'rep-456';

  it('creates a match result with valid inputs', () => {
    const result = MatchResult.create({
      challengeId,
      reporterId,
      claimedWinnerId,
      evidenceUrl: 'https://storage.trustvault.io/proof.png',
    });

    expect(result.id).toBeDefined();
    expect(result.challengeId).toBe(challengeId);
    expect(result.reporterId).toBe(reporterId);
    expect(result.claimedWinnerId).toBe(claimedWinnerId);
    expect(result.evidenceUrl).toBe('https://storage.trustvault.io/proof.png');
    expect(result.verificationStatus).toBe('PENDING');
    expect(result.aiConfidence).toBeNull();
  });

  it('validates mandatory fields', () => {
    expect(() =>
      MatchResult.create({
        challengeId: '',
        reporterId,
        claimedWinnerId,
      }),
    ).toThrow(ValidationError);
  });

  it('updates verification status and confidence', () => {
    const result = MatchResult.create({
      challengeId,
      reporterId,
      claimedWinnerId,
    });

    result.setVerification('VERIFIED', 0.96);
    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.aiConfidence).toBe(0.96);
  });
});
