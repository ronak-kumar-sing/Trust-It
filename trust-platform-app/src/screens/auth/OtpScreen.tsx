import React, { useState, useEffect, useCallback } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

/**
 * OtpScreen handles 6-digit verification code entry and auto-advance to KYC/Profile.
 */
export const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { verifyOtp, isLoading } = useAuthStore();

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleVerify = useCallback(async () => {
    if (otp.length < 6) {
      setErrorText('Please enter the full 6-digit OTP');
      return;
    }
    setErrorText(null);
    const success = await verifyOtp(phone, otp);
    if (success) {
      navigation.navigate('Kyc');
    } else {
      setErrorText('Invalid code. For preview use: 123456');
    }
  }, [otp, phone, verifyOtp, navigation]);

  const handleResend = useCallback(() => {
    setTimerSeconds(45);
    setErrorText(null);
  }, []);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{Strings.auth.otpTitle}</Text>
            <Text style={styles.subtitle}>
              {Strings.auth.otpSubtitle} {phone}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Input
              placeholder="123456"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                if (errorText) setErrorText(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={errorText ?? undefined}
              leftIcon="key-outline"
            />
          </View>

          <Button
            title={Strings.auth.verifyOtp}
            onPress={handleVerify}
            loading={isLoading}
            disabled={isLoading || otp.length < 6}
            variant="primary"
            size="lg"
          />

          <View style={styles.resendContainer}>
            {timerSeconds > 0 ? (
              <Text style={styles.timerText}>
                {Strings.auth.resendOtp} {timerSeconds}s
              </Text>
            ) : (
              <Button
                title="Resend Code Now"
                onPress={handleResend}
                variant="ghost"
                size="sm"
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginVertical: Spacing.md,
  },
  resendContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  timerText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
});
