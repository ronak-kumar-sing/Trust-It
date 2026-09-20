import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(({
  title = Strings.common.errorTitle,
  message = Strings.common.errorMessage,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry ? (
        <Button
          onPress={onRetry}
          size="sm"
          style={styles.retryButton}
          title={Strings.common.retry}
          variant="outline"
        />
      ) : null}
    </View>
  );
});

ErrorState.displayName = 'ErrorState';

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
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: Spacing.lg,
  },
});
