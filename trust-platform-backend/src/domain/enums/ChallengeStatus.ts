/** Gaming challenge statuses */
export const ChallengeStatus = {
  OPEN: 'OPEN',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESULTS_REPORTED: 'RESULTS_REPORTED',
  CONSENSUS_REACHED: 'CONSENSUS_REACHED',
  DISPUTED: 'DISPUTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type ChallengeStatusType = typeof ChallengeStatus[keyof typeof ChallengeStatus];

/** Match result verification statuses */
export const VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  INCONCLUSIVE: 'INCONCLUSIVE',
} as const;

export type VerificationStatusType =
  typeof VerificationStatus[keyof typeof VerificationStatus];
