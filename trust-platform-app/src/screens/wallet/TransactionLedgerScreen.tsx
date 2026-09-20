import React, { useState, useMemo, useCallback } from 'react';
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
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useWalletStore } from '../../store/walletStore';
import { TransactionType, LedgerEntry } from '../../types';
import { formatINR, formatDate, truncateHash } from '../../utils/formatters';

type Props = NativeStackScreenProps<WalletStackParamList, 'TransactionLedger'>;

const FILTER_TABS: { label: string; value?: TransactionType }[] = [
  { label: 'All' },
  { label: 'Deposits', value: 'DEPOSIT' },
  { label: 'Escrow Locks', value: 'ESCROW_LOCK' },
  { label: 'Releases', value: 'ESCROW_RELEASE' },
  { label: 'Withdrawals', value: 'WITHDRAWAL' },
];

/**
 * TransactionLedgerScreen provides a filterable, immutable audit ledger of all balance adjustments.
 */
export const TransactionLedgerScreen: React.FC<Props> = ({ navigation }) => {
  const { ledger } = useWalletStore();
  const [selectedFilter, setSelectedFilter] = useState<TransactionType | undefined>(undefined);

  const filteredEntries = useMemo(() => {
    if (!selectedFilter) return ledger;
    return ledger.filter((entry) => entry.type === selectedFilter);
  }, [ledger, selectedFilter]);

  const renderItem = useCallback(
    ({ item }: { item: LedgerEntry }) => {
      const isCredit = item.amount > 0;
      return (
        <Card style={styles.entryCard} variant="flat">
          <View style={styles.header}>
            <View style={styles.typeRow}>
              <Text style={styles.typeText}>{item.type.replace(/_/g, ' ')}</Text>
              <Badge label={item.status} variant="success" />
            </View>
            <Text style={[styles.amountText, isCredit ? styles.creditText : styles.debitText]}>
              {isCredit ? `+${formatINR(item.amount)}` : formatINR(item.amount)}
            </Text>
          </View>

          <Text style={styles.descText}>{item.description}</Text>

          <View style={styles.footer}>
            <Text style={styles.refText}>TxID: {truncateHash(item.referenceId, 10, 6)}</Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </Card>
      );
    },
    []
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header title={Strings.wallet.transactionLedger} onBack={() => navigation.goBack()} />

      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(t) => t.label}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.value;
            return (
              <Pressable
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedFilter(item.value)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No Transactions"
          description="No ledger entries found for the selected filter."
        />
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  filterBar: {
    marginVertical: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  amountText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
  },
  creditText: {
    color: Colors.success,
  },
  debitText: {
    color: Colors.textPrimary,
  },
  descText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 4,
  },
  refText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.mono,
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
});
