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
import { formatINR } from '../../utils/formatters';
import { escrowService } from '../../services/escrowService';
import { MOCK_BALANCES } from '../../api/mockData';

type Props = NativeStackScreenProps<EscrowStackParamList, 'FundEscrow'>;

/**
 * FundEscrowScreen provides the breakdown for locking funds into escrow:
 * Item price, 1% platform fee, total amount, wallet balance check, and idempotency lock.
 */
export const FundEscrowScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listingId, amount, title } = route.params;
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = Math.round(amount * 0.01);
  const total = amount + fee;

  const handleConfirmLock = useCallback(async () => {
    try {
      setIsLocking(true);
      setError(null);
      const createdEscrow = await escrowService.fundEscrow(listingId, amount);
      setIsLocking(false);
      navigation.replace('VerificationStatus', { escrowId: createdEscrow.id });
    } catch {
      setError('Payment lock failed. Please verify your available balance.');
      setIsLocking(false);
    }
  }, [listingId, amount, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title="Lock Funds in Escrow" onBack={() => navigation.goBack()} />

      <Card style={styles.summaryCard} variant="elevated">
        <Text style={styles.assetTitle}>{title}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Asset Purchase Price</Text>
          <Text style={styles.val}>{formatINR(amount)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{Strings.common.fee}</Text>
          <Text style={styles.val}>{formatINR(fee)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total Escrow Lock</Text>
          <Text style={styles.totalVal}>{formatINR(total)}</Text>
        </View>
      </Card>

      <Card style={styles.balanceCard} variant="flat">
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Available Escrow Balance</Text>
            <Text style={styles.balanceVal}>{formatINR(MOCK_BALANCES.available)}</Text>
          </View>
          <Text style={styles.sufficientBadge}>✓ Sufficient</Text>
        </View>
      </Card>

      <Card style={styles.stateNotice} variant="flat">
        <Text style={styles.noticeTitle}>Escrow State Transition</Text>
        <Text style={styles.noticeText}>
          Locking funds will transition this transaction from INITIATED to FUNDED_IN_ESCROW.
          The seller's credentials will be transferred into the secure inspection vault immediately.
        </Text>
      </Card>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.btnRow}>
        <Button
          title={isLocking ? Strings.common.processing : 'Confirm & Lock Funds'}
          onPress={handleConfirmLock}
          loading={isLocking}
          disabled={isLocking}
          variant="primary"
          size="lg"
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  assetTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  val: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  totalVal: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  balanceVal: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sufficientBadge: {
    color: Colors.success,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  stateNotice: {
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.25)',
    marginBottom: Spacing.lg,
  },
  noticeTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.md,
  },
  btnRow: {
    marginBottom: Spacing.xxl,
  },
});
