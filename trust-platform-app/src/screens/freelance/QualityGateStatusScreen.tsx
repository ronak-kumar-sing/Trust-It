import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelanceStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { QualityGatePipeline } from '../../components/domain/QualityGatePipeline';
import { QualityGateResult } from '../../types';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'QualityGateStatus'>;

/**
 * QualityGateStatusScreen visualizes the AI code review pipeline results.
 */
export const QualityGateStatusScreen: React.FC<Props> = ({ route, navigation }) => {
  const { milestoneId } = route.params;
  const [result, setResult] = useState<QualityGateResult | null>(null);

  useEffect(() => {
    // Simulated inspection response
    const timer = setTimeout(() => {
      setResult({
        linterPassed: true,
        testCoveragePercent: 94.2,
        criticalVulnerabilities: 0,
        ghostingRiskScore: 12,
        overallPassed: true,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.freelance.qualityGate} onBack={() => navigation.goBack()} />

      {result ? (
        <View style={styles.content}>
          <QualityGatePipeline result={result} />

          <Card style={styles.detailCard} variant="elevated">
            <Text style={styles.detailTitle}>Quality Analysis Summary</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vitest Test Suites:</Text>
              <Text style={styles.detailVal}>24 passed, 0 failed (94.2% lines)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ESLint Strict Mode:</Text>
              <Text style={styles.detailVal}>0 errors, 0 warnings</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>AI Ghosting Index:</Text>
              <Text style={styles.detailVal}>12 / 100 (Very Low Risk)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dependencies CVEs:</Text>
              <Text style={styles.detailVal}>Clean (0 known CVEs)</Text>
            </View>
          </Card>

          <Card style={styles.nextStepCard} variant="flat">
            <Text style={styles.nextStepTitle}>Next Step: Client Review Window</Text>
            <Text style={styles.nextStepText}>
              All quality gates have passed. The client now has 14 days to review the deliverable
              before autonomous escrow fund release.
            </Text>
          </Card>

          <Button
            title="Proceed to Client Review Window"
            onPress={() => navigation.replace('ClientReview', { milestoneId })}
            variant="primary"
            size="lg"
            style={styles.actionBtn}
          />
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xxl,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  nextStepCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    marginBottom: Spacing.lg,
  },
  nextStepTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    marginBottom: 4,
  },
  nextStepText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actionBtn: {
    marginTop: Spacing.sm,
  },
});
