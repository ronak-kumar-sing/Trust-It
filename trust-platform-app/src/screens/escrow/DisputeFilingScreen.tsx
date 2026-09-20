import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { escrowService } from '../../services/escrowService';

type Props = NativeStackScreenProps<EscrowStackParamList, 'DisputeFiling'>;

const REASONS = [
  'Invalid or Expired Credentials',
  'Original Seller Reclaimed Account',
  'Transfer Rights Not Granted',
  'Asset Does Not Match Specification',
];

/**
 * DisputeFilingScreen allows buyer to freeze escrow funds and file
 * supporting evidence into the 3-tier arbitration pool.
 */
export const DisputeFilingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { escrowId } = route.params;
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitDispute = useCallback(async () => {
    if (!description.trim()) return;
    try {
      setIsSubmitting(true);
      await escrowService.fileDispute(escrowId, selectedReason, description);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch {
      setIsSubmitting(false);
    }
  }, [escrowId, selectedReason, description]);

  return (
    <ScreenWrapper scrollable>
      <Header title="File Escrow Dispute" onBack={() => navigation.goBack()} />

      {isSubmitted ? (
        <Card style={styles.submittedCard} variant="flat">
          <Text style={styles.submittedTitle}>⚠️ Dispute Filed & Funds Frozen</Text>
          <Text style={styles.submittedDesc}>
            Escrow state transitioned to DISPUTED. An autonomous AI Arbiter is reviewing the
            credentials ledger. The seller has 24 hours to respond before Community Jury escalation.
          </Text>
          <Button
            title="Return to Marketplace"
            onPress={() => navigation.navigate('BrowseListings')}
            variant="primary"
            size="md"
            style={styles.returnBtn}
          />
        </Card>
      ) : (
        <View style={styles.formContainer}>
          <Card style={styles.noticeCard} variant="flat">
            <Text style={styles.noticeTitle}>3-Tier Dispute Arbitration Protection</Text>
            <Text style={styles.noticeDesc}>
              Filing a dispute halts auto-release immediately. Tier 1 AI analysis reviews auth logs;
              Tier 2 offers peer mediation; Tier 3 triggers Community Jury voting.
            </Text>
          </Card>

          <Text style={styles.label}>{Strings.escrow.disputeReason}</Text>
          <View style={styles.reasonsList}>
            {REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Dispute Details & Log Evidence"
            placeholder="Explain what happened when testing the credentials..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>{Strings.escrow.evidenceUpload}</Text>
            <Button
              title={evidenceUploaded ? '✓ Screenshot Attached' : 'Attach Screenshot / Clip'}
              variant={evidenceUploaded ? 'secondary' : 'outline'}
              size="md"
              onPress={() => setEvidenceUploaded(true)}
              icon={evidenceUploaded ? 'checkmark-circle' : 'camera-outline'}
            />
          </View>

          <Button
            title="Submit Dispute & Freeze Funds"
            onPress={handleSubmitDispute}
            loading={isSubmitting}
            disabled={!description.trim() || isSubmitting}
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
  formContainer: {
    paddingBottom: Spacing.xxl,
  },
  noticeCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    marginBottom: Spacing.lg,
  },
  noticeTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.danger,
    marginBottom: 4,
  },
  noticeDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reasonsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonOption: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonOptionSelected: {
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
  uploadSection: {
    marginVertical: Spacing.md,
  },
  uploadLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontWeight: Typography.weight.semibold,
  },
  submitBtn: {
    marginTop: Spacing.sm,
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
