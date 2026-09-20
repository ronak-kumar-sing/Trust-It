import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { QualityGateResult } from '../../types/freelance';
import { Badge } from '../ui/Badge';

export interface QualityGatePipelineProps {
  result: QualityGateResult;
}

/**
 * QualityGatePipeline visualizes the AI automated verification pipeline:
 * Linting Check, Unit Test Coverage, Security Vulnerabilities, and Ghosting Risk.
 */
export const QualityGatePipeline: React.FC<QualityGatePipelineProps> = memo(({ result }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>AI Quality Gate Verification</Text>
        <Badge
          label={result.overallPassed ? 'ALL GATES PASSED' : 'GATE REVIEW FAILED'}
          variant={result.overallPassed ? 'success' : 'danger'}
        />
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Linter & Types</Text>
          <Text
            style={[
              styles.metricValue,
              { color: result.linterPassed ? Colors.success : Colors.danger },
            ]}
          >
            {result.linterPassed ? '✓ 0 Errors' : '✗ Failed'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Coverage</Text>
          <Text
            style={[
              styles.metricValue,
              { color: result.testCoveragePercent >= 80 ? Colors.success : Colors.warning },
            ]}
          >
            {result.testCoveragePercent}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Vulnerabilities</Text>
          <Text
            style={[
              styles.metricValue,
              { color: result.criticalVulnerabilities === 0 ? Colors.success : Colors.danger },
            ]}
          >
            {result.criticalVulnerabilities === 0 ? '✓ None' : `${result.criticalVulnerabilities} Critical`}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Ghosting Risk</Text>
          <Text
            style={[
              styles.metricValue,
              { color: result.ghostingRiskScore < 30 ? Colors.success : Colors.warning },
            ]}
          >
            {result.ghostingRiskScore}/100
          </Text>
        </View>
      </View>
    </View>
  );
});

QualityGatePipeline.displayName = 'QualityGatePipeline';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
});
