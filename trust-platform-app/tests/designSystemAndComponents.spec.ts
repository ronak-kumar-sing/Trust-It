import { describe, it, expect } from 'vitest';
import { Colors } from '../src/constants/colors';
import { Spacing } from '../src/constants/spacing';
import { Typography } from '../src/constants/typography';
import { Strings } from '../src/constants/strings';

describe('Part 3.1 — Design System & Tokens Verification', () => {
  it('should have correct primary and status brand colors', () => {
    expect(Colors.primary).toBe('#1A56DB');
    expect(Colors.success).toBe('#059669');
    expect(Colors.danger).toBe('#DC2626');
    expect(Colors.backgroundDark).toBe('#0A0D14');
  });

  it('should have all 6 core escrow states defined in colors', () => {
    expect(Colors.stateInitiated).toBeDefined();
    expect(Colors.stateFunded).toBeDefined();
    expect(Colors.stateInspection).toBeDefined();
    expect(Colors.stateDisputed).toBeDefined();
    expect(Colors.stateReleased).toBeDefined();
    expect(Colors.stateRefunded).toBeDefined();
  });

  it('should have consistent 4px grid spacing tokens', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(12);
    expect(Spacing.lg).toBe(16);
    expect(Spacing.touchTargetMin).toBeGreaterThanOrEqual(44);
  });

  it('should provide comprehensive user-facing strings without empty values', () => {
    expect(Strings.common.appName).toBe('TrustVault');
    expect(Strings.auth.loginTitle).toBeTruthy();
    expect(Strings.home.trustScore).toBeTruthy();
    expect(Strings.escrow.fundEscrow).toBeTruthy();
    expect(Strings.freelance.qualityGate).toBeTruthy();
    expect(Strings.gaming.challengeBoard).toBeTruthy();
    expect(Strings.wallet.availableBalance).toBeTruthy();
    expect(Strings.settings.security).toBeTruthy();
  });

  it('should provide complete typography scales with line heights', () => {
    expect(Typography.size.base).toBe(15);
    expect(Typography.weight.bold).toBe('700');
    expect(Typography.lineHeight.base).toBeGreaterThan(Typography.size.base);
  });
});
