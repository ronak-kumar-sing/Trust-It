import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelanceStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/domain/CountdownTimer';
import { freelanceService } from '../../services/freelanceService';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'ClientReview'>;

/**
 * ClientReviewScreen manages the 14-day client review period, release approval,
 * revision requests, and dispute triggers.
 */
export const ClientReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { milestoneId } = route.params;
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = useCallback(async () => {
    try {
      setIsApproving(true);
      await freelanceService.approveMilestone(milestoneId);
      setIsApproving(false);
      setIsApproved(true);
    } catch {
      setIsApproving(false);
    }
  }, [milestoneId]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.freelance.clientReviewTitle} onBack={() => navigation.goBack()} />

      <CountdownTimer
        initialSeconds={9 * 24 * 3600 + 14 * 3600}
        label="14-Day Auto-Release Countdown"
      />

      <Card style={styles.deliverableCard} variant="elevated">
        <Text style={styles.cardHeader}>Submitted Deliverable Pull Request</Text>
        <Text style={styles.repoUrl}>https://github.com/trust-platform/backend-v2/pull/14</Text>
        <Text style={styles.notesText}>
          Implemented Fastify plugins, Zod validators, and 24 integration tests.
        </Text>
      </Card>

      <Card style={styles.gatePassedCard} variant="flat">
        <Text style={styles.gatePassedTitle}>✓ AI Quality Gate: 94.2% Test Coverage</Text>
        <Text style={styles.gatePassedDesc}>
          Zero critical vulnerabilities detected. Static analysis verified against OWASP guidelines.
        </Text>
      </Card>

      {isApproved ? (
        <Card style={styles.successCard} variant="flat">
          <Text style={styles.successTitle}>✓ Milestone Approved & Funds Released</Text>
          <Text style={styles.successDesc}>
            ₹20,000 has been credited to Rohan Sharma's wallet.
          </Text>
          <Button
            title="Back to Projects"
            onPress={() => navigation.navigate('BrowseProjects')}
            variant="primary"
            size="md"
            style={styles.backBtn}
          />
        </Card>
      ) : (
        <View style={styles.actions}>
          <Button
            title={Strings.freelance.approveMilestone}
            onPress={handleApprove}
            loading={isApproving}
            variant="primary"
            size="lg"
          />

          <Button
            title={Strings.freelance.requestRevision}
            onPress={() => navigation.goBack()}
            variant="outline"
            size="md"
          />

          <Button
            title={Strings.freelance.disputeContinuity}
            onPress={() => navigation.navigate('FreelanceDispute', { milestoneId })}
            variant="danger"
            size="md"
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  deliverableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  cardHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  repoUrl: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.mono,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  gatePassedCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    marginBottom: Spacing.lg,
  },
  gatePassedTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    marginBottom: 2,
  },
  gatePassedDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  successCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    marginBottom: 4,
  },
  successDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: '100%',
  },
});
