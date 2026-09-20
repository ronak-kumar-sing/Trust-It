/**
 * Strict 4px/8px Spacing Grid for TrustVault.
 * Used across all margins, paddings, and layout gaps.
 */
export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,

  // Semantic layout shortcuts
  screenPadding: 16,
  cardPadding: 16,
  gutter: 12,
  touchTargetMin: 48,
  borderRadiusSm: 6,
  borderRadiusMd: 10,
  borderRadiusLg: 14,
  borderRadiusFull: 9999,
} as const;
