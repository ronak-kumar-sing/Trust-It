/**
 * Data payload for BullMQ auto-release job.
 */
export interface AutoReleaseJobData {
  escrowTransactionId: string;
  scheduledAt: string;
}

/**
 * Data payload for AI verification jobs.
 */
export interface AIVerificationJobData {
  type: 'credential' | 'code-quality' | 'match' | 'ghosting';
  entityId: string;
  payload: Record<string, unknown>;
}

export type EscrowJobData = AutoReleaseJobData | AIVerificationJobData;
