import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../store/walletStore';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<WalletStackParamList, 'WithdrawFunds'>;

/**
 * WithdrawFundsScreen allows verified traders to withdraw funds to linked bank accounts or UPI.
 */
export const WithdrawFundsScreen: React.FC<Props> = ({ navigation }) => {
  const { balances, debitFunds } = useWalletStore();
  const [amountStr, setAmountStr] = useState('10000');
  const [destination, setDestination] = useState('alextrader@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = useCallback(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (val > balances.available) {
      setError(`Amount exceeds available balance of ${formatINR(balances.available)}`);
      return;
    }
    if (!destination.trim()) {
      setError('Please provide a valid UPI ID or bank account.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setTimeout(() => {
      debitFunds(val, `wth_payout_${Date.now()}`);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 900);
  }, [amountStr, balances.available, destination, debitFunds]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.wallet.withdraw} onBack={() => navigation.goBack()} />

      <Card style={styles.limitCard} variant="flat">
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Available to Withdraw</Text>
          <Text style={styles.limitVal}>{formatINR(balances.available)}</Text>
        </View>
        <Text style={styles.limitNote}>
          Verified Gold Tier limit: Up to ₹5,00,000 per day. Settled within 30 minutes via IMPS.
        </Text>
      </Card>

      <View style={styles.form}>
        <Input
          label="Withdrawal Amount (INR)"
          placeholder="e.g. 10000"
          value={amountStr}
          onChangeText={setAmountStr}
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Input
          label={Strings.wallet.bankAccount}
          placeholder="e.g. name@upi or Account + IFSC"
          value={destination}
          onChangeText={setDestination}
          leftIcon="card-outline"
        />

        <View style={styles.feeBox}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Payout Processing Fee:</Text>
            <Text style={styles.feeVal}>₹50 flat</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.netLabel}>Net Disbursed to Bank:</Text>
            <Text style={styles.netVal}>
              {formatINR(Math.max(0, (parseFloat(amountStr) || 0) - 50))}
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isSuccess ? (
          <Card style={styles.successCard} variant="flat">
            <Text style={styles.successTitle}>✓ Withdrawal Initiated</Text>
            <Text style={styles.successDesc}>
              ₹{amountStr} is being dispatched to {destination}. Reference ID: IMPS-{Date.now()}
            </Text>
            <Button
              title="Return to Wallet"
              onPress={() => navigation.goBack()}
              variant="primary"
              size="md"
              style={styles.returnBtn}
            />
          </Card>
        ) : (
          <Button
            title="Confirm Withdrawal"
            onPress={handleWithdraw}
            loading={isProcessing}
            disabled={isProcessing}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  limitCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  limitLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  limitVal: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
  },
  limitNote: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  form: {
    marginTop: Spacing.xs,
  },
  feeBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  feeVal: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  netLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  netVal: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
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
  successCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
    marginTop: Spacing.md,
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
  returnBtn: {
    width: '100%',
  },
});
