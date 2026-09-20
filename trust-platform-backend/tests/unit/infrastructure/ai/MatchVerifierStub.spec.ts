import { describe, it, expect } from 'vitest';
import { MatchVerifierStub } from '../../../../src/infrastructure/ai/MatchVerifierStub.js';

describe('MatchVerifierStub', () => {
  const verifier = new MatchVerifierStub();

  it('validates authentic match screenshot', async () => {
    const res = await verifier.verifyEvidence(
      'https://storage.trustvault.io/matches/clean-proof.png',
      'winner-1',
      'challenge-1',
    );

    expect(res.isFraudulent).toBe(false);
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    expect(res.detectedWinnerId).toBe('winner-1');
  });

  it('flags fraudulent screenshot with fake keywords', async () => {
    const res = await verifier.verifyEvidence(
      'https://storage.trustvault.io/matches/fake-screenshot.png',
      'fraud-user',
      'challenge-2',
    );

    expect(res.isFraudulent).toBe(true);
    expect(res.detectedWinnerId).toBeNull();
    expect(res.reason).toContain('Tampered screenshot');
  });
});
