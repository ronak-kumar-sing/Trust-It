import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export type CardVariant = 'flat' | 'elevated' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentPadding?: number;
}

/**
 * Surface card container with consistent border and subtle elevation.
 */
export const Card: React.FC<CardProps> = React.memo(({
  children,
  variant = 'flat',
  onPress,
  style,
  contentPadding = Spacing.cardPadding,
}) => {
  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    { padding: contentPadding },
    style ?? {},
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
});

Card.displayName = 'Card';

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  variant_flat: {
    backgroundColor: Colors.surfaceCardDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  variant_elevated: {
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  variant_outlined: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
});
