/** Types of escrow transactions supported by the platform */
export const EscrowType = {
  DIGITAL_GOODS: 'DIGITAL_GOODS',
  FREELANCE_MILESTONE: 'FREELANCE_MILESTONE',
  GAMING_WAGER: 'GAMING_WAGER',
} as const;

export type EscrowTypeValue = typeof EscrowType[keyof typeof EscrowType];
