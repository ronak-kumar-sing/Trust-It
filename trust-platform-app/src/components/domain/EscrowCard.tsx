import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EscrowTransaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { formatINR } from '../../utils/formatters';

export interface EscrowCardProps {
  transaction: EscrowTransaction;
  onPress?: (transaction: EscrowTransaction) => void;
}

interface CategoryStyle {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
}

/**
 * EscrowCard renders an escrow transaction item styled after Stitch TrustVault:
 * category icon square, counterparty info, bold INR amount, divider, and
 * live status pill with countdown indicator.
 */
export const EscrowCard: React.FC<EscrowCardProps> = memo(({ transaction, onPress }) => {
  const getCategoryStyle = (category: EscrowTransaction['category']): CategoryStyle => {
    switch (category) {
      case 'DIGITAL_GOODS':
        return {
          icon: 'shield-checkmark',
          color: '#1A56DB',
          bg: '#EFF6FF',
          label: Strings.home.digitalGoods,
        };
      case 'FREELANCE':
        return {
          icon: 'code-slash',
          color: '#7C3AED',
          bg: '#FAF5FF',
          label: Strings.home.freelance,
        };
      case 'GAMING':
        return {
          icon: 'game-controller',
          color: '#059669',
          bg: '#ECFDF5',
          label: Strings.home.gaming,
        };
    }
  };

  const getStatusColor = (status: EscrowTransaction['status']): string => {
    switch (status) {
      case 'RELEASED':
        return Colors.success;
      case 'INSPECTION_PERIOD':
        return '#D97706'; // amber-600
      case 'FUNDED_IN_ESCROW':
        return Colors.primary;
      case 'DISPUTED':
      case 'CANCELLED':
        return Colors.danger;
      case 'INITIATED':
        return '#B45309';
      default:
        return Colors.textMuted;
    }
  };

  const catStyle = getCategoryStyle(transaction.category);
  const statusColor = getStatusColor(transaction.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(transaction)}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${formatINR(transaction.amount)}`}
    >
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={[styles.iconContainer, { backgroundColor: catStyle.bg }]}>
            <Ionicons name={catStyle.icon} size={20} color={catStyle.color} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {transaction.title}
            </Text>
            <Text style={styles.counterparty} numberOfLines={1}>
              Counterparty: @{transaction.counterpartyName}
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.amount}>{formatINR(transaction.amount)}</Text>
          <Text style={styles.categoryBadge}>{catStyle.label.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {transaction.status.replace(/_/g, ' ')}
          </Text>
        </View>

        {transaction.inspectionHoursRemaining !== undefined ? (
          <View style={styles.timePill}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} style={styles.timeIcon} />
            <Text style={styles.timeText}>{transaction.inspectionHoursRemaining}h remaining</Text>
          </View>
        ) : (
          <View style={styles.timePill}>
            <Ionicons name="shield-outline" size={12} color="#059669" style={styles.timeIcon} />
            <Text style={styles.protectedText}>Escrow Locked</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

EscrowCard.displayName = 'EscrowCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  counterparty: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: Typography.weight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.4,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  protectedText: {
    fontSize: Typography.size.xs,
    color: '#059669',
    fontWeight: Typography.weight.semibold,
  },
});
