import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TrustScoreRing } from '../../components/domain/TrustScoreRing';
import { useAuthStore } from '../../store/authStore';
import { homeService, TrustScoreBreakdown } from '../../services/homeService';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrustScoreDetail'>;

/**
 * TrustScoreDetailScreen shows the granular scoring breakdown,
 * dispute history, and anti-decay advice.
 */
export const TrustScoreDetailScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [breakdown, setBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBreakdown = useCallback(async () => {
    setIsLoading(true);
    const data = await homeService.getTrustScoreBreakdown();
    setBreakdown(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return (
    <ScreenWrapper scrollable>
      <Header
        title="Trust Score Breakdown"
        onBack={() => navigation.goBack()}
      />

      {isLoading || !breakdown ? (
        <LoadingSpinner message="Calculating dynamic trust metrics..." />
      ) : (
        <View style={styles.container}>
          <TrustScoreRing
            score={breakdown.currentScore}
            tier={breakdown.tier}
            showDecayWarning={breakdown.decayWarning}
          />

          <View style={styles.tierInfoBox}>
            <Text style={styles.tierInfoTitle}>Gold Tier Privilege Status</Text>
            <Text style={styles.tierInfoDesc}>
              Top 5% trader score on TrustVault. Instant buyer credential release enabled,
              1% reduced transaction fee, and expedited community dispute arbitration.
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Reputation Factor Breakdown</Text>

          {breakdown.factors.map((factor, idx) => (
            <Card key={idx} style={styles.factorCard} variant="flat">
              <View style={styles.factorHeader}>
                <Text style={styles.factorTitle}>{factor.title}</Text>
                <Text style={styles.factorPoints}>
                  +{factor.points} <Text style={styles.factorMax}>/ {factor.maxPoints}</Text>
                </Text>
              </View>
              <Text style={styles.factorDesc}>{factor.description}</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, (factor.points / factor.maxPoints) * 100)}%` },
                  ]}
                />
              </View>
            </Card>
          ))}

          <View style={styles.decayNoticeCard}>
            <Text style={styles.decayNoticeTitle}>Inactivity Decay Policy</Text>
            <Text style={styles.decayNoticeText}>
              To prevent dormant malicious account takeovers, accounts without escrow activity for
              30 days lose 15 points weekly until next transaction. Days until decay: {breakdown.daysUntilDecay} days.
            </Text>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
  tierInfoBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tierGold,
    marginVertical: Spacing.md,
  },
  tierInfoTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.tierGold,
    marginBottom: 4,
  },
  tierInfoDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  sectionHeading: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  factorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  factorPoints: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
  },
  factorMax: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.regular,
  },
  factorDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  decayNoticeCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  decayNoticeTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  decayNoticeText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
});
