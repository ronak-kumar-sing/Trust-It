import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

/**
 * ProfileSetupScreen allows the user to choose their handle, display name, and avatar.
 */
export const ProfileSetupScreen: React.FC<Props> = () => {
  const { user, updateProfile, setToken } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? 'Alex Trader');
  const [handle, setHandle] = useState(user?.handle ?? '@alextrader');
  const [email, setEmail] = useState(user?.email ?? 'alex.trader@trustvault.io');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
      updateProfile({
        displayName,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        email,
      });
      // Setting token switches RootNavigator from AuthStack to MainTab
      setToken('jwt_authenticated_active_session');
      setIsSubmitting(false);
    }, 600);
  }, [displayName, handle, email, updateProfile, setToken]);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{Strings.auth.profileTitle}</Text>
          <Text style={styles.subtitle}>{Strings.auth.profileSubtitle}</Text>
        </View>

        <View style={styles.avatarSection}>
          <Avatar
            name={displayName}
            size="xl"
            badge="verified"
          />
          <Text style={styles.avatarHint}>Pre-verified Trader Identity</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={Strings.auth.displayNameLabel}
            placeholder="Alex Trader"
            value={displayName}
            onChangeText={setDisplayName}
            leftIcon="person-outline"
          />

          <Input
            label="Trading Handle"
            placeholder="@trader_name"
            value={handle}
            onChangeText={setHandle}
            leftIcon="at-outline"
          />

          <Input
            label={Strings.auth.emailLabel}
            placeholder="alex@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail-outline"
          />

          <Button
            title={Strings.auth.completeProfile}
            onPress={handleComplete}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  avatarHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  form: {
    marginTop: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
