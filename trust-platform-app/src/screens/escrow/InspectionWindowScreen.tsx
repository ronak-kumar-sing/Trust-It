import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/domain/CountdownTimer';
import { escrowService } from '../../services/escrowService';

type Props = NativeStackScreenProps<EscrowStackParamList, 'InspectionWindow'>;

/**
 * InspectionWindowScreen provides buyer inspection controls, countdown timer,
 * secure credential reveal, and fund release or dispute actions.
 */
export const InspectionWindowScreen: React.FC<Props> = ({ route, navigation }) => {
  const { escrowId } = route.params;
  const [credentialsRevealed, setCredentialsRevealed] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isReleased, setIsReleased] = useState(false);

  const handleApproveRelease = useCallback(async () => {
    try {
      setIsReleasing(true);
      await escrowService.approveRelease(escrowId);
      setIsReleasing(false);
      setIsReleased(true);
    } catch {
      setIsReleasing(false);
    }
  }, [escrowId]);

  return (
    <ScreenWrapper scrollable>
      <Header title="Inspection Window (24h)" onBack={() => navigation.goBack()} />

      <CountdownTimer
        initialSeconds={18 * 3600 + 24 * 60}
        label="Auto-Release Countdown"
      />

      <Card style={styles.vaultCard} variant="elevated">
        <Text style={styles.vaultTitle}>🔐 Secured Credential Vault</Text>
        <Text style={styles.vaultDesc}>
          Credentials transferred from seller into your inspection custody. Test login and revoke
          prior session tokens within this window.
        </Text>

        {credentialsRevealed ? (
          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>Auth Transfer Key:</Text>
            <Text style={styles.secretText}>auth_key_prod_8991a27e029c488</Text>
            <Text style={styles.secretLabel}>Recovery Email Password:</Text>
            <Text style={styles.secretText}>T-Vault#Secure2026!Handle</Text>
          </View>
        ) : (
          <Button
            title="Reveal Vault Credentials"
            onPress={() => setCredentialsRevealed(true)}
            variant="outline"
            size="md"
            icon="key-outline"
            style={styles.revealBtn}
          />
        )}
      </Card>

      <Card style={styles.checklistCard} variant="flat">
        <Text style={styles.checklistTitle}>Buyer Verification Checklist</Text>
        <Text style={styles.checkItem}>✓ Login and change account recovery email</Text>
        <Text style={styles.checkItem}>✓ Reset password & enable Two-Factor Authentication (2FA)</Text>
        <Text style={styles.checkItem}>✓ Check domain DNS registry propagation</Text>
        <Text style={styles.checkItem}>✓ Confirm zero pending dispute flags on third-party service</Text>
      </Card>

      {isReleased ? (
        <Card style={styles.successCard} variant="flat">
          <Text style={styles.successTitle}>✓ Transaction Released & Finalized</Text>
          <Text style={styles.successDesc}>
            Funds have been paid out to the seller. Your Trust Score has increased by +15 points.
          </Text>
          <Button
            title="Back to Marketplace"
            onPress={() => navigation.navigate('BrowseListings')}
            variant="primary"
            size="md"
            style={styles.backBtn}
          />
        </Card>
      ) : (
        <View style={styles.actions}>
          <Button
            title={Strings.escrow.approveRelease}
            onPress={handleApproveRelease}
            loading={isReleasing}
            variant="primary"
            size="lg"
            style={styles.releaseBtn}
          />

          <Button
            title={Strings.escrow.fileDispute}
            onPress={() => navigation.navigate('DisputeFiling', { escrowId })}
            variant="danger"
            size="md"
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  vaultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  vaultTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  vaultDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.md,
  },
  revealBtn: {
    marginTop: Spacing.xs,
  },
  secretBox: {
    backgroundColor: Colors.surfaceElevatedDark,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secretLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  secretText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.mono,
    color: Colors.primaryLight,
    marginBottom: Spacing.sm,
    fontWeight: Typography.weight.bold,
  },
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  checklistTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  checkItem: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  releaseBtn: {
    marginBottom: Spacing.xs,
  },
  successCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: '100%',
  },
});
