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

type Props = NativeStackScreenProps<FreelanceStackParamList, 'SubmitDeliverable'>;

/**
 * SubmitDeliverableScreen accepts git repo links and triggers autonomous quality gate evaluation.
 */
export const SubmitDeliverableScreen: React.FC<Props> = ({ route, navigation }) => {
  const { milestoneId, title } = route.params;
  const [repoUrl, setRepoUrl] = useState('https://github.com/trust-platform/backend-v2/pull/14');
  const [notes, setNotes] = useState('Completed Fastify plugins, Zod validation, and 24 Vitest tests.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!repoUrl.trim()) {
      setError('Please provide a repository URL or pull request link');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await freelanceService.submitDeliverable(milestoneId, repoUrl, notes);
      setIsSubmitting(false);
      navigation.replace('QualityGateStatus', { milestoneId });
    } catch {
      setError('Deliverable submission failed.');
      setIsSubmitting(false);
    }
  }, [milestoneId, repoUrl, notes, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.freelance.submitDeliverable} onBack={() => navigation.goBack()} />

      <Card style={styles.headerCard} variant="flat">
        <Text style={styles.milestoneLabel}>Submitting For Milestone:</Text>
        <Text style={styles.milestoneTitle}>{title}</Text>
      </Card>

      <View style={styles.form}>
        <Input
          label={Strings.freelance.gitRepoUrl}
          placeholder="https://github.com/org/repo/pull/123"
          value={repoUrl}
          onChangeText={setRepoUrl}
          leftIcon="git-branch-outline"
        />

        <Input
          label="Deliverable Notes & Deployment Instructions"
          placeholder="Include test commands, environment variables, or summary..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Run AI Quality Gate Analysis"
          onPress={handleSubmit}
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
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  milestoneLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
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
