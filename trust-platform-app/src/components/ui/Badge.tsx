import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Strings } from '../../constants/strings';

export type EscrowStatus =
  | 'INITIATED'
  | 'FUNDED_IN_ESCROW'
  | 'INSPECTION_PERIOD'
  | 'DISPUTED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'PASSED'
  | 'FAILED'
  | 'PENDING';

export interface BadgeProps {
  status?: EscrowStatus;
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  style?: ViewStyle;
}

const statusConfig: Record<EscrowStatus, { bg: string; text: string; label: string }> = {
  INITIATED: {
    bg: 'rgba(107, 114, 128, 0.12)',
    text: Colors.stateInitiated,
    label: Strings.statusBadges.initiated,
  },
  FUNDED_IN_ESCROW: {
    bg: 'rgba(2, 132, 199, 0.12)',
    text: Colors.stateFunded,
    label: Strings.statusBadges.funded,
  },
  INSPECTION_PERIOD: {
    bg: 'rgba(139, 92, 246, 0.12)',
    text: Colors.stateInspection,
    label: Strings.statusBadges.inspection,
  },
  DISPUTED: {
    bg: 'rgba(220, 38, 38, 0.12)',
    text: Colors.stateDisputed,
    label: Strings.statusBadges.disputed,
  },
  RELEASED: {
    bg: 'rgba(5, 150, 105, 0.12)',
    text: Colors.stateReleased,
    label: Strings.statusBadges.released,
  },
  REFUNDED: {
    bg: 'rgba(217, 119, 6, 0.12)',
    text: Colors.stateRefunded,
    label: Strings.statusBadges.refunded,
  },
  PASSED: {
    bg: 'rgba(5, 150, 105, 0.12)',
    text: Colors.success,
    label: Strings.statusBadges.passed,
  },
  FAILED: {
    bg: 'rgba(220, 38, 38, 0.12)',
    text: Colors.danger,
    label: Strings.statusBadges.failed,
  },
  PENDING: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: Colors.warning,
    label: Strings.statusBadges.pending,
  },
};

/**
 * High-clarity status pill badge for financial escrow states and verification pipelines.
 */
export const Badge: React.FC<BadgeProps> = React.memo(({
  status,
  label,
  variant,
  style,
}) => {
  let backgroundColor = 'rgba(107, 114, 128, 0.12)';
  let textColor: string = Colors.textSecondary;
  let displayText = label ?? '';

  if (status && statusConfig[status]) {
    backgroundColor = statusConfig[status].bg;
    textColor = statusConfig[status].text;
    displayText = label ?? statusConfig[status].label;
  } else if (variant) {
    switch (variant) {
      case 'success':
        backgroundColor = 'rgba(5, 150, 105, 0.12)';
        textColor = Colors.success;
        break;
      case 'danger':
        backgroundColor = 'rgba(220, 38, 38, 0.12)';
        textColor = Colors.danger;
        break;
      case 'warning':
        backgroundColor = 'rgba(245, 158, 11, 0.12)';
        textColor = Colors.warning;
        break;
      case 'info':
        backgroundColor = 'rgba(37, 99, 235, 0.12)';
        textColor = Colors.info;
        break;
      case 'neutral':
      default:
        backgroundColor = 'rgba(107, 114, 128, 0.12)';
        textColor = Colors.textSecondary;
        break;
    }
  }

  const containerStyle: ViewStyle[] = [
    styles.pill,
    { backgroundColor },
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    { color: textColor },
  ];

  const dotStyle: ViewStyle[] = [
    styles.dot,
    { backgroundColor: textColor },
  ];

  return (
    <View style={containerStyle}>
      <View style={dotStyle} />
      <Text numberOfLines={1} style={textStyle}>
        {displayText}
      </Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Spacing.borderRadiusFull,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  text: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
