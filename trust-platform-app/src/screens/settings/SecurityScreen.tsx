import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SecurityAuth'>;

/**
 * SecurityScreen manages Two-Factor Authentication (2FA), biometric locks, and linked devices.
 */
export const SecurityScreen: React.FC<Props> = ({ navigation }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.settings.security} onBack={() => navigation.goBack()} />

      <Card style={styles.sectionCard} variant="flat">
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>{Strings.settings.twoFactorEnabled}</Text>
            <Text style={styles.switchSubtitle}>
              Requires Google Authenticator or Authy code for all escrow releases and withdrawals.
            </Text>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={setTwoFactorEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={twoFactorEnabled ? Colors.white : Colors.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Biometric App Unlock</Text>
            <Text style={styles.switchSubtitle}>
              Unlock TrustVault using Face ID or Fingerprint on app resume.
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={biometricsEnabled ? Colors.white : Colors.textMuted}
          />
        </View>
      </Card>

      <Text style={styles.sectionHeader}>{Strings.settings.linkedDevices}</Text>

      <Card style={styles.deviceCard} variant="flat">
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>OnePlus 12 (This Device)</Text>
          <Text style={styles.activeTag}>Current</Text>
        </View>
        <Text style={styles.deviceMeta}>Bangalore, India • Active now</Text>
      </Card>

      <Card style={styles.deviceCard} variant="flat">
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>MacBook Pro 16" (Chrome 128)</Text>
        </View>
        <Text style={styles.deviceMeta}>Mumbai, India • 2 days ago</Text>
      </Card>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  sectionHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  deviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  activeTag: {
    fontSize: Typography.size.xs,
    color: Colors.success,
    fontWeight: Typography.weight.bold,
  },
  deviceMeta: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
});
