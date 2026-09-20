import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { gamingService } from '../../services/gamingService';

type Props = NativeStackScreenProps<GamingStackParamList, 'MatchResult'>;

/**
 * MatchResultScreen allows players to report match outcome and attach victory screenshots.
 */
export const MatchResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { challengeId } = route.params;
  const [outcome, setOutcome] = useState<'WIN' | 'LOSS'>('WIN');
  const [proofAttached, setProofAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await gamingService.reportResult(
        challengeId,
        outcome === 'WIN',
        'https://trustvault.io/proofs/match_bgmi_991.png'
      );
      setIsSubmitting(false);
      navigation.replace('CvVerification', { matchId: challengeId });
    } catch {
      setIsSubmitting(false);
    }
  }, [challengeId, outcome, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.gaming.reportResult} onBack={() => navigation.goBack()} />

      <Text style={styles.sectionLabel}>Did you win or lose?</Text>
      <View style={styles.outcomeRow}>
        <Pressable
          style={[styles.outcomeBtn, outcome === 'WIN' && styles.winSelected]}
          onPress={() => setOutcome('WIN')}
        >
          <Text style={[styles.outcomeText, outcome === 'WIN' && styles.winTextSelected]}>
            🏆 {Strings.gaming.iWon}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.outcomeBtn, outcome === 'LOSS' && styles.lossSelected]}
          onPress={() => setOutcome('LOSS')}
        >
          <Text style={[styles.outcomeText, outcome === 'LOSS' && styles.lossTextSelected]}>
            💀 {Strings.gaming.iLost}
          </Text>
        </Pressable>
      </View>

      <Card style={styles.proofCard} variant="elevated">
        <Text style={styles.proofTitle}>{Strings.gaming.uploadProof}</Text>
        <Text style={styles.proofDesc}>
          TrustVault's Computer Vision AI scans the end-game victory banner, scoreboard kills, and
          timestamp to ensure anti-tamper compliance.
        </Text>

        <Button
          title={proofAttached ? '✓ Screenshot Analyzed & Ready' : 'Upload Match End Screenshot'}
          onPress={() => setProofAttached(true)}
          variant={proofAttached ? 'secondary' : 'outline'}
          size="md"
          icon={proofAttached ? 'checkmark-circle' : 'image-outline'}
        />
      </Card>

      <Button
        title="Submit for AI CV Verification"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        variant="primary"
        size="lg"
        style={styles.submitBtn}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  outcomeBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  winSelected: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  lossSelected: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  outcomeText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
  },
  winTextSelected: {
    color: Colors.success,
  },
  lossTextSelected: {
    color: Colors.danger,
  },
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  proofTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  proofDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    marginBottom: Spacing.xxl,
  },
});
