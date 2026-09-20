import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AccountSettings'>;

/**
 * AccountSettingsScreen manages user identity, verification status, and app configuration.
 */
export const AccountSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.settings.settingsTitle} />

      {/* Profile Overview */}
      <Card style={styles.profileCard} variant="elevated">
        <View style={styles.profileRow}>
          <Avatar
            name={user?.displayName ?? 'Alex Trader'}
            size="lg"
            badge="verified"
          />
          <View style={styles.profileDetails}>
            <Text style={styles.displayName}>{user?.displayName ?? 'Alex Trader'}</Text>
            <Text style={styles.handle}>{user?.handle ?? '@alextrader'}</Text>
            <View style={styles.tierPill}>
              <Badge label={`${user?.tier ?? 'GOLD'} TIER`} variant="success" />
            </View>
          </View>
        </View>
      </Card>

      {/* Settings Navigation Menu */}
      <View style={styles.menuSection}>
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate('SecurityAuth')}
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={styles.menuTitle}>{Strings.settings.security}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate('HelpSupport')}
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuTitle}>{Strings.settings.helpSupport}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
      </View>

      {/* App Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>{Strings.settings.version}</Text>
        <Text style={styles.techText}>Fastify • Supabase • BullMQ • React Native v0.86</Text>
      </View>

      <Button
        title={Strings.settings.logout}
        onPress={handleLogout}
        variant="outline"
        size="lg"
        style={styles.logoutBtn}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  displayName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  handle: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tierPill: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  menuSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  menuTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  versionText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.semibold,
  },
  techText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    marginBottom: Spacing.xxl,
  },
});
