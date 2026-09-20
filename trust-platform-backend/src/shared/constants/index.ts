/** Platform-wide constants */

/** Inspection window durations in hours */
export const INSPECTION_WINDOWS = {
  /** Digital goods: 48-hour inspection */
  DIGITAL_GOODS: 48,
  /** Freelance milestone: 14-day client review */
  FREELANCE_MILESTONE: 336,
  /** Gaming wager: 30-minute response window */
  GAMING_WAGER_RESPONSE: 0.5,
} as const;

/** Platform fee percentages (basis points — 100 = 1%) */
export const PLATFORM_FEES = {
  /** Standard platform fee: 5% */
  STANDARD: 500,
  /** Dispute deposit: 5% of transaction amount */
  DISPUTE_DEPOSIT: 500,
  /** Slash penalty for fraudulent evidence submission: 10% */
  SLASH_PENALTY: 1000,
} as const;

/** Trust score adjustments */
export const TRUST_SCORE_ADJUSTMENTS = {
  /** Points gained for completing an escrow */
  ESCROW_COMPLETED: 5,
  COMPLETED_ESCROW: 5,
  /** Points lost for losing a dispute */
  DISPUTE_LOST: -15,
  DISPUTE_LOST_MINOR: -5,
  DISPUTE_LOST_MAJOR: -15,
  DISPUTE_FRAUDULENT: -30,
  /** Points gained for winning a dispute */
  DISPUTE_WON: 2,
  /** Points lost per month of inactivity */
  INACTIVITY_DECAY: -2,
  /** Points gained for KYC verification */
  KYC_VERIFIED: 15,
} as const;

/** Trust score tier limits */
export const TRUST_TIERS = {
  /** Score < 30: Starter tier */
  STARTER: { minScore: 0, maxEscrow: 500000 },      // ₹5,000
  /** Score 30-59: Bronze tier */
  BRONZE: { minScore: 30, maxEscrow: 2500000 },      // ₹25,000
  /** Score 60-79: Silver tier */
  SILVER: { minScore: 60, maxEscrow: 10000000 },     // ₹1,00,000
  /** Score 80-94: Gold tier */
  GOLD: { minScore: 80, maxEscrow: 50000000 },       // ₹5,00,000
  /** Score 95+: Platinum tier */
  PLATINUM: { minScore: 95, maxEscrow: 100000000 },   // ₹10,00,000
} as const;

/** Maximum revision rounds for freelance milestones */
export const MAX_REVISION_ROUNDS = 3;

/** API versioning prefix */
export const API_PREFIX = '/api/v1';
