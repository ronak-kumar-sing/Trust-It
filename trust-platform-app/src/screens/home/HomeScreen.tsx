import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TrustScoreRing } from '../../components/domain/TrustScoreRing';
import { EscrowCard } from '../../components/domain/EscrowCard';
import { useAuthStore } from '../../store/authStore';
import { homeService } from '../../services/homeService';
import { EscrowTransaction } from '../../types';
import { MOCK_ESCROWS } from '../../api/mockData';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeDashboard'>;

/**
 * HomeScreen provides the primary dashboard view: user overview, Trust Score ring,
 * 3 vertical quick action navigations, and active escrows.
 */
export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const rootNavigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [escrows, setEscrows] = useState<EscrowTransaction[]>(MOCK_ESCROWS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrows = useCallback(async () => {
    try {
      setError(null);
      const data = await homeService.getActiveEscrows();
      setEscrows(data);
    } catch {
      setError('Unable to load active escrows');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEscrows();
    setIsRefreshing(false);
  }, [fetchEscrows]);

  const handleEscrowPress = useCallback(
    (escrow: EscrowTransaction) => {
      if (escrow.category === 'DIGITAL_GOODS') {
        rootNavigation.navigate('EscrowTab', {
          screen: 'InspectionWindow',
          params: { escrowId: escrow.id },
        });
      } else if (escrow.category === 'FREELANCE') {
        rootNavigation.navigate('FreelanceTab', {
          screen: 'ClientReview',
          params: { milestoneId: 'ms_02' },
        });
      } else {
        rootNavigation.navigate('GamingTab', {
          screen: 'MatchLobby',
          params: { challengeId: 'chal_gm_301' },
        });
      }
    },
    [rootNavigation]
  );

  return (
    <ScreenWrapper
      scrollable
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      {/* Top Welcome Bar */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <Avatar
            name={user?.displayName ?? 'Alex Trader'}
            size="md"
            badge="verified"
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.greetingText}>{Strings.home.welcome}</Text>
            <Text style={styles.userName}>{user?.displayName ?? 'Alex Trader'}</Text>
          </View>
        </View>

        <Pressable
          style={styles.notifButton}
          onPress={() => navigation.navigate('NotificationCenter')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadgeDot} />
        </Pressable>
      </View>

      {/* Trust Score Hero Card */}
      <Card style={styles.trustCard} variant="elevated">
        <View style={styles.trustCardHeader}>
          <Text style={styles.trustCardTitle}>{Strings.home.trustScore}</Text>
          <Pressable
            onPress={() => navigation.navigate('TrustScoreDetail')}
            accessibilityRole="button"
          >
            <Text style={styles.breakdownLink}>{Strings.home.viewScoreBreakdown} ›</Text>
          </Pressable>
        </View>

        <TrustScoreRing
          score={user?.trustScore ?? 845}
          tier={user?.tier ?? 'GOLD'}
          showDecayWarning={false}
        />
      </Card>

      {/* 3 Verticals Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{Strings.home.quickActions}</Text>
      </View>

      <View style={styles.actionsGrid}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={() => rootNavigation.navigate('EscrowTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.digitalGoods}
        >
          <Text style={styles.actionIcon}>🔑</Text>
          <Text style={styles.actionTitle}>{Strings.home.digitalGoods}</Text>
          <Text style={styles.actionDesc} numberOfLines={2}>
            {Strings.home.digitalGoodsDesc}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={() => rootNavigation.navigate('FreelanceTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.freelance}
        >
          <Text style={styles.actionIcon}>💻</Text>
          <Text style={styles.actionTitle}>{Strings.home.freelance}</Text>
          <Text style={styles.actionDesc} numberOfLines={2}>
            {Strings.home.freelanceDesc}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={() => rootNavigation.navigate('GamingTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.gaming}
        >
          <Text style={styles.actionIcon}>🎮</Text>
          <Text style={styles.actionTitle}>{Strings.home.gaming}</Text>
          <Text style={styles.actionDesc} numberOfLines={2}>
            {Strings.home.gamingDesc}
          </Text>
        </Pressable>
      </View>

      {/* Active Escrows Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{Strings.home.activeEscrows}</Text>
        <Text style={styles.sectionCount}>{escrows.length} Active</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Fetching active transactions..." />
      ) : error ? (
        <ErrorState
          title={Strings.common.errorTitle}
          message={error}
          onRetry={fetchEscrows}
        />
      ) : escrows.length === 0 ? (
        <EmptyState
          title="No Active Escrows"
          description="You have no open transactions locked in escrow."
        />
      ) : (
        <View style={styles.escrowList}>
          {escrows.map((tx) => (
            <EscrowCard
              key={tx.id}
              transaction={tx}
              onPress={handleEscrowPress}
            />
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: Spacing.md,
  },
  greetingText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifIcon: {
    fontSize: 18,
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  trustCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  trustCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  trustCardTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  breakdownLink: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primaryLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  actionsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionCardPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  escrowList: {
    marginTop: Spacing.xs,
  },
});
