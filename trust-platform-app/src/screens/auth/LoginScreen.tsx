import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * LoginScreen handles phone-based OTP entry and Google OAuth trigger.
 */
export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { loginWithPhone, isLoading } = useAuthStore();

  const handleSendOtp = useCallback(async () => {
    if (!phone || phone.trim().length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLocalError(null);
    try {
      await loginWithPhone(phone);
      navigation.navigate('Otp', { phone });
    } catch {
      setLocalError('Failed to send verification code. Please try again.');
    }
  }, [phone, loginWithPhone, navigation]);

  const handleGoogleSignIn = useCallback(() => {
    // Simulated Google OAuth flow
    navigation.navigate('ProfileSetup');
  }, [navigation]);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>TRUSTVAULT ESCROW</Text>
            </View>
            <Text style={styles.title}>{Strings.auth.loginTitle}</Text>
            <Text style={styles.subtitle}>{Strings.auth.loginSubtitle}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={Strings.auth.phoneLabel}
              placeholder={Strings.auth.phonePlaceholder}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (localError) setLocalError(null);
              }}
              keyboardType="phone-pad"
              maxLength={15}
              error={localError ?? undefined}
              leftIcon="call-outline"
            />

            <Button
              title={Strings.auth.sendOtp}
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="lg"
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title={Strings.auth.googleSignIn}
              onPress={handleGoogleSignIn}
              variant="outline"
              size="lg"
              icon="logo-google"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(26, 86, 219, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
  },
  form: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
});
