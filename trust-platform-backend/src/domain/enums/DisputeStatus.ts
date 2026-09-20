/** Dispute resolution tiers */
export const DisputeResolutionTier = {
  /** AI-mediated automatic resolution */
  TIER_1_AI: 'TIER_1_AI',
  /** Human mediator review */
  TIER_2_MEDIATOR: 'TIER_2_MEDIATOR',
  /** Panel review for high-value disputes */
  TIER_3_PANEL: 'TIER_3_PANEL',
} as const;

export type DisputeResolutionTierType =
  typeof DisputeResolutionTier[keyof typeof DisputeResolutionTier];

/** Dispute statuses */
export const DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED_BUYER_WINS: 'RESOLVED_BUYER_WINS',
  RESOLVED_SELLER_WINS: 'RESOLVED_SELLER_WINS',
  RESOLVED_SPLIT: 'RESOLVED_SPLIT',
  CANCELLED: 'CANCELLED',
} as const;

export type DisputeStatusType = typeof DisputeStatus[keyof typeof DisputeStatus];
