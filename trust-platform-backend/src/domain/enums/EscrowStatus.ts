/** All possible escrow transaction statuses */
export const EscrowStatus = {
  INITIATED: 'INITIATED',
  FUNDED_IN_ESCROW: 'FUNDED_IN_ESCROW',
  DELIVERED: 'DELIVERED',
  INSPECTION_PERIOD: 'INSPECTION_PERIOD',
  DISPUTED: 'DISPUTED',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export type EscrowStatusType = typeof EscrowStatus[keyof typeof EscrowStatus];

/**
 * Defines ALL valid state transitions for the escrow state machine.
 * Any transition NOT in this table is ILLEGAL and must be rejected.
 */
export const ESCROW_TRANSITIONS: Record<EscrowStatusType, readonly EscrowStatusType[]> = {
  INITIATED: ['FUNDED_IN_ESCROW', 'CANCELLED'],
  FUNDED_IN_ESCROW: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
  DELIVERED: ['INSPECTION_PERIOD'],
  INSPECTION_PERIOD: ['RELEASED', 'DISPUTED', 'REFUNDED'],
  DISPUTED: ['RELEASED', 'REFUNDED'],
  RELEASED: [],
  REFUNDED: [],
  CANCELLED: [],
} as const;

/** Terminal states where no further transitions are possible */
export const TERMINAL_STATES: readonly EscrowStatusType[] = [
  EscrowStatus.RELEASED,
  EscrowStatus.REFUNDED,
  EscrowStatus.CANCELLED,
] as const;
