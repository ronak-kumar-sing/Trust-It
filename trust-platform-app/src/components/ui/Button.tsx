import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Text label displayed inside the button */
  title: string;
  /** Callback fired when user presses the button */
  onPress: () => void;
  /** Visual hierarchy variant */
  variant?: ButtonVariant;
  /** Size affecting padding and typography */
  size?: ButtonSize;
  /** Displays a loading spinner and disables press */
  loading?: boolean;
  /** Disables touch interactions */
  disabled?: boolean;
  /** Optional icon rendered before the title */
  icon?: React.ReactNode;
  /** Additional container style override */
  style?: ViewStyle;
}

/**
 * High-craft primary and secondary action button.
 * Adheres strictly to StyleSheet.create with touch targets >= 48px.
 */
export const Button: React.FC<ButtonProps> = React.memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isInteractive = !disabled && !loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    disabled ? styles.disabled : {},
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.baseText,
    styles[`textSize_${size}`],
    styles[`textVariant_${variant}`],
    disabled ? styles.disabledText : {},
  ];

  const spinnerColor = variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      activeOpacity={0.8}
      disabled={!isInteractive}
      onPress={onPress}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.borderRadiusMd,
    minHeight: Spacing.touchTargetMin,
  },
  baseText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontWeight: Typography.weight.semiBold,
    textAlign: 'center',
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 38,
  },
  size_md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: Spacing.touchTargetMin,
  },
  size_lg: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    minHeight: 54,
  },

  textSize_sm: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.lineHeight.sm,
  },
  textSize_md: {
    fontSize: Typography.size.base,
    lineHeight: Typography.lineHeight.base,
  },
  textSize_lg: {
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.md,
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  variant_outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },
  variant_danger: {
    backgroundColor: Colors.danger,
  },

  textVariant_primary: {
    color: Colors.white,
  },
  textVariant_secondary: {
    color: Colors.textPrimaryDark,
  },
  textVariant_outline: {
    color: Colors.primary,
  },
  textVariant_ghost: {
    color: Colors.primary,
  },
  textVariant_danger: {
    color: Colors.white,
  },

  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textMutedDark,
  },
});
