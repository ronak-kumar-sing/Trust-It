/** Project statuses for freelance milestone escrow */
export const ProjectStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

/** Milestone statuses */
export const MilestoneStatus = {
  PENDING: 'PENDING',
  FUNDED: 'FUNDED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  RELEASED: 'RELEASED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
} as const;

export type MilestoneStatusType = typeof MilestoneStatus[keyof typeof MilestoneStatus];
