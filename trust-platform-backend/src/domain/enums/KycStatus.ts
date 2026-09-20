/** All possible KYC verification statuses */
export const KycStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type KycStatusType = typeof KycStatus[keyof typeof KycStatus];

/** Valid KYC status transitions */
export const KYC_TRANSITIONS: Record<KycStatusType, readonly KycStatusType[]> = {
  UNVERIFIED: ['PENDING'],
  PENDING: ['VERIFIED', 'REJECTED'],
  VERIFIED: [],
  REJECTED: ['PENDING'],
} as const;
