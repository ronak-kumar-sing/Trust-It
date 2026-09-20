import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label displayed above the input field */
  label?: string;
  /** Error message displayed below input */
  error?: string;
  /** Helper descriptive text */
  helperText?: string;
  /** Prefix icon or symbol */
  leftIcon?: React.ReactNode;
  /** Suffix icon or action */
  rightIcon?: React.ReactNode;
  /** Container style overrides */
  containerStyle?: ViewStyle;
  /** Mode: text, password, search, otp */
  mode?: 'text' | 'password' | 'search' | 'otp';
}

/**
 * High-contrast input field with focus transitions and validation error states.
 */
export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  mode = 'text',
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const isPassword = mode === 'password';
  const effectiveSecure = isPassword ? !isPasswordVisible : secureTextEntry;

  const boxStyle: ViewStyle[] = [
    styles.inputBox,
    isFocused ? styles.inputBoxFocused : {},
    error ? styles.inputBoxError : {},
  ];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={boxStyle}>
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={Colors.textMutedDark}
          secureTextEntry={effectiveSecure}
          style={[styles.textInput, mode === 'otp' ? styles.textInputOtp : {}]}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            onPress={togglePasswordVisibility}
            style={styles.rightIconWrapper}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondaryDark,
    marginBottom: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Spacing.borderRadiusMd,
    minHeight: Spacing.touchTargetMin,
    paddingHorizontal: Spacing.md,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
  },
  inputBoxError: {
    borderColor: Colors.danger,
  },
  textInputOtp: {
    textAlign: 'center',
    letterSpacing: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textPrimaryDark,
    paddingVertical: Spacing.sm,
  },
  leftIconWrapper: {
    marginRight: Spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: Spacing.sm,
  },
  passwordToggleText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.danger,
    marginTop: Spacing.xxs,
  },
  helperText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textMutedDark,
    marginTop: Spacing.xxs,
  },
});
