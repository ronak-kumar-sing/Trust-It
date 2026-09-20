import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<EscrowStackParamList, 'VerificationStatus'>;

interface StepItem {
  id: number;
  label: string;
  detail: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE';
}

/**
 * VerificationStatusScreen displays the automated credential verification steps.
 */
export const VerificationStatusScreen: React.FC<Props> = ({ route, navigation }) => {
  const { escrowId } = route.params;
  const [currentStep, setCurrentStep] = useState(1);

  const steps: StepItem[] = [
    {
      id: 1,
      label: 'Format & Cryptographic Check',
      detail: 'Verifying auth token syntax, header lengths, and checksums.',
      status: currentStep > 1 ? 'COMPLETE' : currentStep === 1 ? 'RUNNING' : 'PENDING',
    },
    {
      id: 2,
      label: 'Autonomous API / DNS Ping',
      detail: 'Validating host server response and domain nameserver configuration.',
      status: currentStep > 2 ? 'COMPLETE' : currentStep === 2 ? 'RUNNING' : 'PENDING',
    },
    {
      id: 3,
      label: 'Owner Key Revocation Check',
      detail: 'Ensuring seller has not initiated concurrent transfer requests.',
      status: currentStep > 3 ? 'COMPLETE' : currentStep === 3 ? 'RUNNING' : 'PENDING',
    },
    {
      id: 4,
      label: 'Secure Vault Deposit',
      detail: 'Credential locked into 24-hour inspection vault.',
      status: currentStep >= 4 ? 'COMPLETE' : 'PENDING',
    },
  ];

  useEffect(() => {
    if (currentStep < 4) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <ScreenWrapper scrollable>
      <Header title="Credential Verification" onBack={() => navigation.goBack()} />

      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>AI Pre-Verification Pipeline</Text>
        <Text style={styles.headerSubtitle}>
          Autonomous checks run before releasing credential keys into your vault.
        </Text>
      </View>

      <View style={styles.stepsList}>
        {steps.map((s) => (
          <Card key={s.id} style={styles.stepCard} variant="flat">
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.statusCircle,
                  s.status === 'COMPLETE' && styles.circleComplete,
                  s.status === 'RUNNING' && styles.circleRunning,
                ]}
              >
                <Text style={styles.circleText}>
                  {s.status === 'COMPLETE' ? '✓' : s.id}
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepDetail}>{s.detail}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {currentStep >= 4 && (
        <View style={styles.actionBox}>
          <Button
            title="Open 24h Inspection Window"
            onPress={() => navigation.replace('InspectionWindow', { escrowId })}
            variant="primary"
            size="lg"
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  stepsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevatedDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  circleComplete: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  circleRunning: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(26, 86, 219, 0.2)',
  },
  circleText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDetail: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  actionBox: {
    marginBottom: Spacing.xxl,
  },
});
