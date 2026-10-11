import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<GamingStackParamList, 'CvVerification'>;

/**
 * CvVerificationScreen displays real-time computer vision result verification.
 */
export const CvVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step < 3) {
      const timer = setTimeout(() => setStep((s) => s + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.gaming.cvAnalysis} onBack={() => navigation.goBack()} />

      <Card style={styles.pipelineCard} variant="elevated">
        <Text style={styles.pipelineTitle}>Autonomous Match Settlement</Text>
        <Text style={styles.pipelineSubtitle}>
          AI Computer Vision model verifying screenshot authentic OCR and image tamper signatures.
        </Text>

        <View style={styles.checksList}>
          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{step >= 1 ? '✓' : '○'}</Text>
            <Text style={[styles.checkText, step >= 1 && styles.checkActive]}>
              OCR Text Extraction: "VICTORY ROYALE" Detected
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{step >= 2 ? '✓' : '○'}</Text>
            <Text style={[styles.checkText, step >= 2 && styles.checkActive]}>
              Anti-Tamper EXIF & Pixel Noise Match: 99.4%
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{step >= 3 ? '✓' : '○'}</Text>
            <Text style={[styles.checkText, step >= 3 && styles.checkActive]}>
              Cross-Player Consensus Confirmed
            </Text>
          </View>
        </View>
      </Card>

      {step >= 3 ? (
        <Card style={styles.payoutCard} variant="flat">
          <View style={styles.payoutHeader}>
            <Ionicons name="trophy-outline" size={20} color={Colors.success} style={styles.payoutIcon} />
            <Text style={styles.payoutTitle}>Match Verified: Victory Payout Settled</Text>
          </View>
          <Text style={styles.payoutAmount}>+₹1,980</Text>
          <Text style={styles.payoutDesc}>
            Directly credited to your available escrow wallet balance. Your Wager Rating increased
            by +25 Elo.
          </Text>

          <Button
            title="View Wager Leaderboard"
            onPress={() => navigation.replace('Leaderboard')}
            variant="primary"
            size="md"
            style={styles.actionBtn}
          />
        </Card>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pipelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  pipelineTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  pipelineSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.md,
  },
  checksList: {
    gap: Spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 16,
    color: Colors.success,
    width: 24,
    fontWeight: Typography.weight.bold,
  },
  checkText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  checkActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
  },
  payoutCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  payoutIcon: {
    marginRight: 6,
  },
  payoutTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    textAlign: 'center',
  },
  payoutAmount: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
    marginVertical: Spacing.xs,
  },
  payoutDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actionBtn: {
    width: '100%',
  },
});
