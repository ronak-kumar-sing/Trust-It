export interface CredentialVerificationDetails {
  formatValid: boolean;
  twoFactorStatus?: 'ENABLED' | 'DISABLED' | 'UNKNOWN';
  riskScore: number; // 0 (safest) to 100 (riskiest)
  checksPerformed: string[];
  notes: string;
}

export interface CredentialVerificationResult {
  isValid: boolean;
  confidence: number;
  accountType?: string;
  details: CredentialVerificationDetails;
}

export interface VerifyCredentialsInput {
  category: string;
  payload: string | Record<string, unknown>;
}

/**
 * Port Contract: AI/Automated Digital Goods Credential Verifier.
 */
export interface ICredentialVerifier {
  /**
   * Validates digital goods credentials, API keys, or account delivery payloads.
   */
  verifyCredentials(input: VerifyCredentialsInput): Promise<CredentialVerificationResult>;
}
