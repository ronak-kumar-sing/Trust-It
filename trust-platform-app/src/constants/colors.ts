/**
 * Design system color palette for TrustVault.
 * Derived from Stitch Mobile design theme with high-contrast, fintech-grade tokens.
 */
export const Colors = {
  // Brand & Action
  primary: '#1A56DB',
  primaryHover: '#1447B8',
  primaryLight: '#E8EEFA',
  primaryDark: '#0E2E7A',

  // Semantic
  success: '#059669',
  successLight: '#ECFDF5',
  successDark: '#065F46',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningDark: '#B45309',

  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerDark: '#991B1B',

  info: '#2563EB',
  infoLight: '#EFF6FF',
  infoDark: '#1D4ED8',

  // Escrow Lifecycle States
  stateInitiated: '#6B7280',
  stateFunded: '#0284C7',
  stateInspection: '#8B5CF6',
  stateDisputed: '#DC2626',
  stateReleased: '#059669',
  stateRefunded: '#D97706',

  // Neutral / Dark Mode Foundations (OLED friendly)
  backgroundDark: '#0A0D14',
  surfaceDark: '#121620',
  surfaceElevatedDark: '#1A202E',
  surfaceCardDark: '#161B26',
  borderDark: '#232938',
  borderSubtleDark: 'rgba(255, 255, 255, 0.08)',
  textPrimaryDark: '#F9FAFB',
  textSecondaryDark: '#9CA3AF',
  textMutedDark: '#6B7280',

  // Light Mode Foundations
  backgroundLight: '#F8FAFC',
  surfaceLight: '#FFFFFF',
  surfaceElevatedLight: '#F1F5F9',
  surfaceCardLight: '#FFFFFF',
  borderLight: '#E2E8F0',
  borderSubtleLight: 'rgba(0, 0, 0, 0.06)',
  textPrimaryLight: '#0F172A',
  textSecondaryLight: '#475569',
  textMutedLight: '#94A3B8',

  // Overlays
  backdrop: 'rgba(15, 23, 42, 0.5)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Active Theme Aliases (Rich Light Theme)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHighlight: '#F1F5F9',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  tierGold: '#D97706',
  tierSilver: '#64748B',
  tierBronze: '#B45309',
} as const;

export type ColorName = keyof typeof Colors;
