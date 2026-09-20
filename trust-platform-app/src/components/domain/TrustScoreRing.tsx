import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { TrustTier } from '../../types/auth';

export interface TrustScoreRingProps {
  score: number;
  tier: TrustTier;
  showDecayWarning?: boolean;
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
      <View style={[styles.outerCircle, { borderColor: tierColor }]}>
        <View style={styles.innerCircle}>
          <Text style={[styles.scoreNumber, { color: tierColor }]}>{score}</Text>
          <Text style={styles.scoreScale}>/ 1000</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${tierColor}20` }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{tier} TIER</Text>
          </View>
        </View>
      </View>

      {showDecayWarning && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ 30-day inactivity decay risk active</Text>
        </View>
      )}
    </View>
  );
});

TrustScoreRing.displayName = 'TrustScoreRing';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
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
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
  },
  warningText: {
    fontSize: Typography.size.xs,
    color: Colors.warning,
    fontWeight: Typography.weight.medium,
  },
});
