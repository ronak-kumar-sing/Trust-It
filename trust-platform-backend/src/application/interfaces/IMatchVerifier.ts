/**
 * Match result verification outcome data.
 */
export interface MatchVerificationResult {
  isFraudulent: boolean;
  confidence: number;
  detectedWinnerId: string | null;
  reason: string;
}

/**
 * Port contract for automated AI / OCR match screenshot & video verification.
 */
export interface IMatchVerifier {
  verifyEvidence(
    evidenceUrl: string,
    claimedWinnerId: string,
    challengeId: string,
  ): Promise<MatchVerificationResult>;
}
