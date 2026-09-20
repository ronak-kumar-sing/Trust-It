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
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { freelanceService } from '../../services/freelanceService';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'CreateMilestone'>;

/**
 * CreateMilestoneScreen defines scope of work criteria and escrow funding amount.
 */
export const CreateMilestoneScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const amount = parseFloat(amountStr);
    if (!title.trim() || !criteria.trim() || isNaN(amount) || amount <= 0) {
      setError('Please provide a milestone title, criteria, and valid amount.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await freelanceService.createMilestone(projectId, {
        title,
        acceptanceCriteria: criteria,
        amount,
      });
      setIsSubmitting(false);
      navigation.goBack();
    } catch {
      setError('Failed to create milestone');
      setIsSubmitting(false);
    }
  }, [projectId, title, criteria, amountStr, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.freelance.createMilestone} onBack={() => navigation.goBack()} />

      <Card style={styles.tipCard} variant="flat">
        <Text style={styles.tipTitle}>Deterministic Scope of Work (SOW)</Text>
        <Text style={styles.tipText}>
          Specify measurable acceptance criteria (e.g. 80%+ test coverage, passing Docker build).
          AI Quality Gates evaluate these automatically before the client review window opens.
        </Text>
      </Card>

      <View style={styles.form}>
        <Input
          label={Strings.freelance.milestoneTitle}
          placeholder="e.g. Fastify Auth Endpoints & Tests"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Escrow Milestone Amount (INR)"
          placeholder="e.g. 15000"
          value={amountStr}
          onChangeText={setAmountStr}
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Input
          label={Strings.freelance.deliverableCriteria}
          placeholder="List specific acceptance tests, API specs, and deliverables..."
          value={criteria}
          onChangeText={setCriteria}
          multiline
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Fund & Add Milestone"
          onPress={handleCreate}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tipTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  form: {
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
