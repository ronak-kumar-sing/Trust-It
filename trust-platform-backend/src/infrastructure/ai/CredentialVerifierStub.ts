import type {
  ICredentialVerifier,
  VerifyCredentialsInput,
  CredentialVerificationResult,
} from '../../application/interfaces/ICredentialVerifier.js';

/**
 * Stub implementation of AI/Automated Digital Goods Credential Verifier.
 * Validates delivery format, API keys, credentials, and detects fraudulent submissions.
 */
export class CredentialVerifierStub implements ICredentialVerifier {
  async verifyCredentials(
    input: VerifyCredentialsInput,
  ): Promise<CredentialVerificationResult> {
    const rawPayload =
      typeof input.payload === 'string'
        ? input.payload
        : JSON.stringify(input.payload);

    const lower = rawPayload.toLowerCase();

    // Detect fraudulent/invalid flags for testing
    if (
      lower.includes('fraud') ||
      lower.includes('fake') ||
      lower.includes('invalid') ||
      lower.includes('expired') ||
      lower.length < 5
    ) {
      return {
        isValid: false,
        confidence: 0.99,
        accountType: input.category,
        details: {
          formatValid: false,
          twoFactorStatus: 'UNKNOWN',
          riskScore: 95,
          checksPerformed: [
            'FORMAT_PARSING',
            'AUTHENTICATION_CHALLENGE',
            'TOKEN_EXPIRY_CHECK',
          ],
          notes: 'Credential payload failed format validation or appears invalid/expired.',
        },
      };
    }

    return {
      isValid: true,
      confidence: 0.96,
      accountType: input.category,
      details: {
        formatValid: true,
        twoFactorStatus: 'DISABLED',
        riskScore: 5,
        checksPerformed: [
          'FORMAT_PARSING',
          'SYNTAX_VALIDATION',
          'TOKEN_ENTROPY_ANALYSIS',
          'PROVIDER_REACHABILITY_CHECK',
        ],
        notes: `Valid credentials successfully verified for category ${input.category}. Low risk profile.`,
      },
    };
  }
}
