import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { TrustTier } from '../../types/auth';

export interface TrustScoreRingProps {
  score: number;
  tier: TrustTier;
  showDecayWarning?: boolean;
}

export interface TrustScoreHeroCardProps {
  score: number;
  tier: TrustTier;
  onPress?: () => void;
}

/**
 * TrustScoreRing displays the user's trust score (0–1000) with
 * color-coded tier accents (Gold, Silver, Bronze) and decay warning.
 */
export const TrustScoreRing: React.FC<TrustScoreRingProps> = memo(({
  score,
  tier,
  showDecayWarning = false,
}) => {
  const getTierColor = (t: TrustTier) => {
    switch (t) {
      case 'GOLD':
        return Colors.tierGold;
      case 'SILVER':
        return Colors.tierSilver;
      case 'BRONZE':
        return Colors.tierBronze;
    }
  };

  const tierColor = getTierColor(tier);

  return (
    <View style={styles.container}>
      <View style={[styles.outerGlow, { borderColor: `${tierColor}30`, backgroundColor: `${tierColor}08` }]}>
        <View style={[styles.outerCircle, { borderColor: tierColor }]}>
          <View style={styles.innerCircle}>
            <Text style={[styles.scoreNumber, { color: tierColor }]}>{score}</Text>
            <Text style={styles.scoreScale}>/ 1000</Text>
            <View style={[styles.tierBadge, { backgroundColor: `${tierColor}20` }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tier} TIER</Text>
            </View>
          </View>
        </View>
      </View>

      {showDecayWarning && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning-outline" size={14} color={Colors.warning} style={styles.warningIcon} />
          <Text style={styles.warningText}>30-day inactivity decay risk active</Text>
        </View>
      )}
    </View>
  );
});

TrustScoreRing.displayName = 'TrustScoreRing';

/**
 * TrustScoreHeroCard displays the horizontal Stitch TrustVault dashboard banner:
 * Circular gauge badge, title with tier pill, perks subtitle, and chevron navigation.
 */
export const TrustScoreHeroCard: React.FC<TrustScoreHeroCardProps> = memo(({
  score,
  tier,
  onPress,
}) => {
  const normalized100 = Math.round(score / 10);
  const tierColor = tier === 'GOLD' ? '#059669' : tier === 'SILVER' ? '#2563EB' : '#D97706';
  const tierBg = tier === 'GOLD' ? '#ECFDF5' : tier === 'SILVER' ? '#EFF6FF' : '#FFFBEB';
  const tierLabel = tier === 'GOLD' ? 'EXCELLENT' : tier === 'SILVER' ? 'GOOD' : 'GROWING';

  return (
    <Pressable
      style={({ pressed }) => [styles.heroCard, pressed && styles.heroCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Trust Score ${normalized100} out of 100, ${tierLabel}`}
    >
      <View style={styles.heroLeft}>
        <View style={[styles.gaugeContainer, { borderColor: `${tierColor}35` }]}>
          <View style={[styles.gaugeInner, { borderColor: tierColor }]}>
            <Text style={styles.gaugeNumber}>{normalized100}</Text>
          </View>
        </View>

        <View style={styles.heroTextCol}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Trust Score: {normalized100}/100</Text>
            <View style={[styles.heroPill, { backgroundColor: tierBg }]}>
              <Text style={[styles.heroPillText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Higher limits & 1.5% lower platform fees unlocked.
          </Text>
        </View>
      </View>

      <View style={styles.chevronButton}>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </View>
    </Pressable>
  );
});

TrustScoreHeroCard.displayName = 'TrustScoreHeroCard';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  outerGlow: {
    padding: 8,
    borderRadius: 80,
    borderWidth: 1,
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extrabold,
    lineHeight: Typography.size.xxxl * 1.1,
  },
  scoreScale: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  tierBadge: {
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tierText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  warningIcon: {
    marginRight: 6,
  },
  warningText: {
    fontSize: Typography.size.xs,
    color: Colors.warning,
    fontWeight: Typography.weight.semibold,
  },
  // Horizontal Hero Card
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heroCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  gaugeContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  gaugeInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  gaugeNumber: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: '#0F172A',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
    marginRight: 6,
  },
  heroPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: Typography.weight.extrabold,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: Typography.size.xs,
    color: '#64748B',
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
