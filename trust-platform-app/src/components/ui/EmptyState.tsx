import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  title = Strings.common.emptyTitle,
  description = Strings.common.emptyMessage,
  actionTitle,
  onAction,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {icon ?? <Text style={styles.defaultIconText}>📭</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onAction ? (
        <Button
          onPress={onAction}
          size="sm"
          style={styles.actionButton}
          title={actionTitle}
          variant="secondary"
        />
      ) : null}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevatedDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  defaultIconText: {
    fontSize: 28,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: Spacing.lg,
  },
});
