/**
 * Quality gate verification result data.
 */
export interface CodeQualityGateResult {
  passed: boolean;
  score: number;
  details: {
    lintErrors: number;
    securityIssues: number;
    testCoveragePercentage: number;
    feedback: string;
  };
}

/**
 * Port contract for automated AI / static code quality checks on milestone deliverables.
 */
export interface ICodeQualityGate {
  check(submissionUrl: string): Promise<CodeQualityGateResult>;
}
