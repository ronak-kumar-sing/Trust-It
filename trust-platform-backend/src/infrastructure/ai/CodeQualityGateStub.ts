import type {
  ICodeQualityGate,
  CodeQualityGateResult,
} from '../../application/interfaces/ICodeQualityGate.js';

/**
 * Stub implementation of AI Code & Deliverable Quality Gate.
 * Validates deliverable structure and returns simulated analysis results.
 */
export class CodeQualityGateStub implements ICodeQualityGate {
  async check(submissionUrl: string): Promise<CodeQualityGateResult> {
    const isGitRepo =
      submissionUrl.includes('github.com') ||
      submissionUrl.includes('gitlab.com') ||
      submissionUrl.includes('bitbucket.org');

    return {
      passed: true,
      score: isGitRepo ? 94 : 88,
      details: {
        lintErrors: 0,
        securityIssues: 0,
        testCoveragePercentage: isGitRepo ? 89 : 80,
        feedback: `Automated scan of deliverable (${submissionUrl}) completed successfully. Static analysis verified clean codebase.`,
      },
    };
  }
}
