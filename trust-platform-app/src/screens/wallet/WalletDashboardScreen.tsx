import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useWalletStore } from '../../store/walletStore';
import { formatINR, formatDate, truncateHash } from '../../utils/formatters';
import { LedgerEntry } from '../../types';

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletDashboard'>;

/**
 * WalletDashboardScreen displays total, available, and frozen escrow balances
 * alongside quick actions and immutable transaction logs.
 */
export const WalletDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { balances, ledger } = useWalletStore();

  const renderLedgerItem = useCallback(
    ({ item }: { item: LedgerEntry }) => {
      const isCredit = item.amount > 0;
      return (
        <Card style={styles.ledgerCard} variant="flat">
          <View style={styles.itemHeader}>
            <Text style={styles.itemType}>{item.type.replace(/_/g, ' ')}</Text>
            <Text style={[styles.itemAmount, isCredit ? styles.amountCredit : styles.amountDebit]}>
              {isCredit ? `+${formatINR(item.amount)}` : formatINR(item.amount)}
            </Text>
          </View>

          <Text style={styles.itemDesc}>{item.description}</Text>

          <View style={styles.itemFooter}>
            <Text style={styles.itemRef}>Ref: {truncateHash(item.referenceId, 8, 4)}</Text>
            <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </Card>
      );
    },
    []
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={Strings.wallet.walletTitle}
        rightAction={
          <Button
            title="Ledger ›"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('TransactionLedger')}
          />
        }
      />

      {/* Hero Balances Card */}
      <Card style={styles.balanceHeroCard} variant="elevated">
        <Text style={styles.heroLabel}>{Strings.wallet.totalBalance}</Text>
        <Text style={styles.heroAmount}>{formatINR(balances.total)}</Text>

        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>{Strings.wallet.availableBalance}</Text>
            <Text style={styles.splitVal}>{formatINR(balances.available)}</Text>
          </View>

          <View style={styles.splitDivider} />

          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>{Strings.wallet.frozenBalance}</Text>
            <Text style={styles.frozenVal}>{formatINR(balances.frozen)}</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <Button
            title={Strings.wallet.addFunds}
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('AddFunds')}
            style={styles.heroBtn}
          />
          <Button
            title={Strings.wallet.withdraw}
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('WithdrawFunds')}
            style={styles.heroBtn}
          />
        </View>
      </Card>

      {/* Recent Ledger Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity Ledger</Text>
        <Text style={styles.stateMachineTag}>Deterministic State Machine</Text>
      </View>

      <FlatList
        data={ledger.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={renderLedgerItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  balanceHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  heroLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  splitCol: {
    flex: 1,
  },
  splitDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  splitLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  splitVal: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
  },
  frozenVal: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.info,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  heroBtn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  stateMachineTag: {
    fontSize: Typography.size.xs,
    color: Colors.primaryLight,
    fontWeight: Typography.weight.semibold,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  ledgerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemType: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  itemAmount: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
  },
  amountCredit: {
    color: Colors.success,
  },
  amountDebit: {
    color: Colors.textPrimary,
  },
  itemDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 4,
  },
  itemRef: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.mono,
    color: Colors.textMuted,
  },
  itemDate: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
});
