import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { EscrowTransaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { formatINR } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

export interface EscrowCardProps {
  transaction: EscrowTransaction;
  onPress?: (transaction: EscrowTransaction) => void;
}

/**
 * EscrowCard renders an escrow transaction summary with status badges,
 * amount in INR, counterparty name, and remaining inspection time.
 */
export const EscrowCard: React.FC<EscrowCardProps> = memo(({ transaction, onPress }) => {
  const getBadgeVariant = (status: EscrowTransaction['status']): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'INITIATED':
        return 'warning';
      case 'FUNDED_IN_ESCROW':
        return 'info';
      case 'INSPECTION_PERIOD':
        return 'info';
      case 'RELEASED':
        return 'success';
      case 'DISPUTED':
      case 'CANCELLED':
        return 'danger';
      case 'REFUNDED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getCategoryLabel = (category: EscrowTransaction['category']) => {
    switch (category) {
      case 'DIGITAL_GOODS':
        return Strings.home.digitalGoods;
      case 'FREELANCE':
        return Strings.home.freelance;
      case 'GAMING':
        return Strings.home.gaming;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(transaction)}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${formatINR(transaction.amount)}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{getCategoryLabel(transaction.category)}</Text>
        </View>
        <Badge
          label={transaction.status.replace(/_/g, ' ')}
          variant={getBadgeVariant(transaction.status)}
        />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {transaction.title}
      </Text>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.counterpartyLabel}>Counterparty</Text>
          <Text style={styles.counterpartyName}>{transaction.counterpartyName}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Escrow Lock</Text>
          <Text style={styles.amountValue}>{formatINR(transaction.amount)}</Text>
        </View>
      </View>

      {transaction.inspectionHoursRemaining !== undefined && (
        <View style={styles.inspectionBanner}>
          <Text style={styles.inspectionText}>
            ⏱️ {transaction.inspectionHoursRemaining}h remaining in inspection window
          </Text>
        </View>
      )}
    </Pressable>
  );
});

EscrowCard.displayName = 'EscrowCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: Colors.surfaceHighlight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  counterpartyLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  counterpartyName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryLight,
  },
  inspectionBanner: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
  },
  inspectionText: {
    fontSize: Typography.size.xs,
    color: Colors.info,
    fontWeight: Typography.weight.medium,
  },
});
