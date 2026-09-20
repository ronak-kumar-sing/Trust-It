import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelanceStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { freelanceService } from '../../services/freelanceService';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'FreelanceDispute'>;

const REASONS = [
  'Contractor Unresponsive / Ghosted Milestone',
  'Codebase Fails Acceptance Criteria',
  'Severe Security / Vulnerability Issues',
  'Unauthorized Scope Deviation',
];

/**
 * FreelanceDisputeScreen initiates the Continuity Pool dispute process
 * to protect freelance milestones and allocate replacement contractors.
 */
export const FreelanceDisputeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { milestoneId } = route.params;
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!details.trim()) return;
    try {
      setIsSubmitting(true);
      await freelanceService.disputeMilestone(milestoneId, `${selectedReason}: ${details}`);
      setIsSubmitting(false);
      setIsDisputed(true);
    } catch {
      setIsSubmitting(false);
    }
  }, [milestoneId, selectedReason, details]);

  return (
    <ScreenWrapper scrollable>
      <Header title="Continuity Pool Dispute" onBack={() => navigation.goBack()} />

      {isDisputed ? (
        <Card style={styles.submittedCard} variant="flat">
          <Text style={styles.submittedTitle}>⚠️ Continuity Pool Activated</Text>
          <Text style={styles.submittedDesc}>
            Milestone funds have been frozen. TrustVault's AI Code Arbiter will inspect git diffs
            and repository commit history. If ghosting is confirmed, funds can be reallocated to a
            replacement verified contractor immediately.
          </Text>
          <Button
            title="Return to Projects"
            onPress={() => navigation.navigate('BrowseProjects')}
            variant="primary"
            size="md"
            style={styles.returnBtn}
          />
        </Card>
      ) : (
        <View style={styles.form}>
          <Card style={styles.continuityCard} variant="flat">
            <Text style={styles.continuityTitle}>Freelance Continuity Guarantee</Text>
            <Text style={styles.continuityDesc}>
              Unlike traditional platforms where projects stall for months in dispute, TrustVault's
              continuity pool can transition work-in-progress code to a peer-vetted contractor with
              pre-funded escrow continuity.
            </Text>
          </Card>

          <Text style={styles.sectionLabel}>Select Reason for Escalation</Text>
          <View style={styles.reasonsBox}>
            {REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <Pressable
                  key={r}
                  style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Audit Notes & Evidence"
            placeholder="Explain commit discrepancies, missed deadlines, or failure logs..."
            value={details}
            onChangeText={setDetails}
            multiline
          />

          <Button
            title="Escalate to Continuity Pool"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!details.trim() || isSubmitting}
            variant="danger"
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    paddingBottom: Spacing.xxl,
  },
  continuityCard: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    marginBottom: Spacing.md,
  },
  continuityTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.warning,
    marginBottom: 4,
  },
  continuityDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reasonsBox: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonItemSelected: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  reasonText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  reasonTextSelected: {
    color: Colors.danger,
    fontWeight: Typography.weight.bold,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  submittedCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submittedTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  submittedDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.lg,
  },
  returnBtn: {
    width: '100%',
  },
});
