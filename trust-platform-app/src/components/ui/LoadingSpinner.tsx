import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Strings } from '../../constants/strings';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({
  message = Strings.common.loading,
  size = 'large',
  color = Colors.primary,
  fullScreen = false,
  style,
}) => {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : {}, style]}>
      <ActivityIndicator color={color} size={size} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  message: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondaryDark,
    marginTop: Spacing.md,
  },
});
