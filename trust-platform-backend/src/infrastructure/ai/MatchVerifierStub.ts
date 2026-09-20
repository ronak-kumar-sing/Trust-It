import type {
  IMatchVerifier,
  MatchVerificationResult,
} from '../../application/interfaces/IMatchVerifier.js';

/**
 * Stub implementation of AI Match Verifier.
 * Analyzes scoreboard evidence, checks for screenshot manipulation, and verifies claimed winner.
 */
export class MatchVerifierStub implements IMatchVerifier {
  async verifyEvidence(
    evidenceUrl: string,
    claimedWinnerId: string,
    _challengeId: string,
  ): Promise<MatchVerificationResult> {
    const isFake =
      evidenceUrl.toLowerCase().includes('fake') ||
      evidenceUrl.toLowerCase().includes('fraud');

    if (isFake) {
      return {
        isFraudulent: true,
        confidence: 0.98,
        detectedWinnerId: null,
        reason: 'Tampered screenshot metadata and edited scoreboard pixels detected',
      };
    }

    return {
      isFraudulent: false,
      confidence: 0.95,
      detectedWinnerId: claimedWinnerId,
      reason: 'Scoreboard screenshot verified authentic with official game telemetry',
    };
  }
}
