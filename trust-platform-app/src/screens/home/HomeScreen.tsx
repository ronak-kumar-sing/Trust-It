import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TrustScoreHeroCard } from '../../components/domain/TrustScoreRing';
import { EscrowCard } from '../../components/domain/EscrowCard';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { homeService } from '../../services/homeService';
import { EscrowTransaction } from '../../types';
import { MOCK_ESCROWS } from '../../api/mockData';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeDashboard'>;

/**
 * HomeScreen delivers the Stitch TrustVault high-craft dashboard:
 * 1. Top verified brand bar + Support action
 * 2. User profile greeting bar with verified badge, search & notifications
 * 3. Dual-Balance Vault Card (Liquid vs In Escrow) with eye balance-masking
 * 4. Trust Score Hero Card with radial gauge and perks overview
 * 5. "Create New Deal" 3-Vertical Action Grid
 * 6. Active Escrows live tracking feed
 * 7. Recent Activity ledger preview
 */
export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const rootNavigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { balances } = useWalletStore();
  const [escrows, setEscrows] = useState<EscrowTransaction[]>(MOCK_ESCROWS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);

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
      {/* 1. Top Brand Bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandLeft}>
          <View style={styles.brandIconBox}>
            <Ionicons name="shield-checkmark" size={18} color="#1A56DB" />
          </View>
          <Text style={styles.brandTitle}>{Strings.common.appName}</Text>
          <View style={styles.bankGradeBadge}>
            <Text style={styles.bankGradeText}>BANK-GRADE</Text>
          </View>
        </View>

        <Pressable
          style={styles.helpButton}
          onPress={() => rootNavigation.navigate('SettingsTab')}
          accessibilityRole="button"
          accessibilityLabel="Help & Support"
        >
          <Ionicons name="help-circle-outline" size={20} color="#64748B" />
        </Pressable>
      </View>

      {/* 2. User Profile Greeting Bar */}
      <View style={styles.userGreetingRow}>
        <View style={styles.userInfoCol}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={user?.displayName ?? 'Alex Trader'}
              size="md"
              badge="verified"
            />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.userTextCol}>
            <View style={styles.nameRow}>
              <Text style={styles.greetingText}>Hey, {user?.displayName ?? 'Alex'}</Text>
              <Ionicons name="shield-checkmark" size={14} color="#059669" style={styles.verifiedIcon} />
            </View>
            <Text style={styles.userSubtitle}>Verified Trader • Level 2</Text>
          </View>
        </View>

        <View style={styles.topActionsRow}>
          <Pressable
            style={styles.circleIconButton}
            onPress={() => rootNavigation.navigate('EscrowTab')}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search-outline" size={18} color="#475569" />
          </Pressable>

          <Pressable
            style={styles.circleIconButton}
            onPress={() => navigation.navigate('NotificationCenter')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color="#475569" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* 3. Dual-Balance Vault Card */}
      <View style={styles.vaultCard}>
        <View style={styles.vaultHeader}>
          <View style={styles.vaultTitleRow}>
            <Text style={styles.vaultLabel}>VAULT BALANCE</Text>
            <Pressable
              onPress={() => setIsMasked((prev) => !prev)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isMasked ? 'Reveal balance' : 'Hide balance'}
            >
              <Ionicons
                name={isMasked ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color="#94A3B8"
                style={styles.eyeIcon}
              />
            </Pressable>
          </View>

          <View style={styles.shieldedPill}>
            <View style={styles.shieldedDot} />
            <Text style={styles.shieldedText}>Shielded Escrow</Text>
          </View>
        </View>

        <View style={styles.vaultBalanceRow}>
          <View style={styles.balanceCol}>
            <Text style={styles.subBalanceLabel}>Available Liquid</Text>
            <Text style={styles.largeBalanceText}>
              {isMasked ? '••••••' : formatINR(balances.available)}
            </Text>
          </View>

          <View style={styles.vaultDivider} />

          <View style={styles.balanceCol}>
            <Text style={styles.subBalanceLabel}>In Escrow</Text>
            <Text style={styles.escrowBalanceText}>
              {isMasked ? '••••••' : formatINR(balances.frozen)}
            </Text>
          </View>
        </View>

        <View style={styles.vaultActionsRow}>
          <Pressable
            style={({ pressed }) => [styles.addFundsBtn, pressed && styles.addFundsBtnPressed]}
            onPress={() => rootNavigation.navigate('WalletTab')}
            accessibilityRole="button"
            accessibilityLabel="Add Funds"
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.addFundsText}>+ Add Funds</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.withdrawBtn, pressed && styles.withdrawBtnPressed]}
            onPress={() => rootNavigation.navigate('WalletTab')}
            accessibilityRole="button"
            accessibilityLabel="Withdraw"
          >
            <Ionicons name="arrow-up" size={16} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.withdrawText}>Withdraw</Text>
          </Pressable>
        </View>
      </View>

      {/* 4. Trust Score Hero Card */}
      <TrustScoreHeroCard
        score={user?.trustScore ?? 845}
        tier={user?.tier ?? 'GOLD'}
        onPress={() => navigation.navigate('TrustScoreDetail')}
      />

      {/* 5. "Create New Deal" 3-Vertical Action Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Create New Deal</Text>
        <Text style={styles.sectionSubtext}>Select Escrow Type</Text>
      </View>

      <View style={styles.verticalsRow}>
        {/* Trade Goods */}
        <Pressable
          style={({ pressed }) => [styles.verticalCard, styles.tradeCard, pressed && styles.verticalCardPressed]}
          onPress={() => rootNavigation.navigate('EscrowTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.digitalGoods}
        >
          <View style={[styles.vertIconBox, styles.tradeIconBox]}>
            <Ionicons name="shield-checkmark" size={20} color="#1A56DB" />
          </View>
          <Text style={styles.vertTitle}>Trade Goods</Text>
          <Text style={styles.vertDesc}>Accounts & APIs</Text>
        </Pressable>

        {/* Freelance */}
        <Pressable
          style={({ pressed }) => [styles.verticalCard, styles.freelanceCard, pressed && styles.verticalCardPressed]}
          onPress={() => rootNavigation.navigate('FreelanceTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.freelance}
        >
          <View style={[styles.vertIconBox, styles.freelanceIconBox]}>
            <Ionicons name="code-slash" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.vertTitle}>Freelance</Text>
          <Text style={styles.vertDesc}>Code & Works</Text>
        </Pressable>

        {/* Wagers */}
        <Pressable
          style={({ pressed }) => [styles.verticalCard, styles.wagerCard, pressed && styles.verticalCardPressed]}
          onPress={() => rootNavigation.navigate('GamingTab')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.gaming}
        >
          <View style={[styles.vertIconBox, styles.wagerIconBox]}>
            <Ionicons name="game-controller" size={20} color="#059669" />
          </View>
          <Text style={styles.vertTitle}>Wagers</Text>
          <Text style={styles.vertDesc}>1v1 Gaming</Text>
        </Pressable>
      </View>

      {/* 6. Active Escrows Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>{Strings.home.activeEscrows}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{escrows.length} Active</Text>
          </View>
        </View>

        <Pressable
          onPress={() => rootNavigation.navigate('EscrowTab')}
          accessibilityRole="button"
          accessibilityLabel="View all active escrows"
        >
          <Text style={styles.viewAllText}>{Strings.common.viewAll} →</Text>
        </Pressable>
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

      {/* 7. Recent Activity Ledger Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{Strings.home.recentActivity}</Text>
        <Pressable
          onPress={() => rootNavigation.navigate('WalletTab')}
          accessibilityRole="button"
          accessibilityLabel="View full transaction ledger"
        >
          <Text style={styles.viewAllText}>Ledger →</Text>
        </Pressable>
      </View>

      <View style={styles.activityCard}>
        <View style={styles.activityRow}>
          <View style={[styles.activityIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="call-outline" size={16} color="#059669" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Payment Released</Text>
            <Text style={styles.activitySub}>Valorant Radiant Account • 2h ago</Text>
          </View>
          <Text style={styles.activityAmountPositive}>+₹8,500</Text>
        </View>

        <View style={styles.activityDivider} />

        <View style={styles.activityRow}>
          <View style={[styles.activityIconBox, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="lock-closed-outline" size={16} color="#D97706" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Escrow Locked</Text>
            <Text style={styles.activitySub}>@cyber_domain Handle • 1d ago</Text>
          </View>
          <Text style={styles.activityAmountNeutral}>-₹12,000</Text>
        </View>

        <View style={styles.activityDivider} />

        <View style={styles.activityRow}>
          <View style={[styles.activityIconBox, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="trophy-outline" size={16} color="#7C3AED" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Wager Stake Claimed</Text>
            <Text style={styles.activitySub}>BGMI 1v1 TDM Stake • 3d ago</Text>
          </View>
          <Text style={styles.activityAmountPositive}>+₹3,400</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  brandTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: '#0F172A',
    letterSpacing: -0.5,
    marginRight: Spacing.xs,
  },
  bankGradeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bankGradeText: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: '#1A56DB',
    letterSpacing: 0.5,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userGreetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  userInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userTextCol: {
    marginLeft: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  userSubtitle: {
    fontSize: Typography.size.xs,
    color: '#64748B',
    fontWeight: Typography.weight.medium,
    marginTop: 1,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  // Dual-Balance Vault Card
  vaultCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultLabel: {
    fontSize: 11,
    fontWeight: Typography.weight.extrabold,
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  eyeIcon: {
    marginLeft: 6,
  },
  shieldedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  shieldedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  shieldedText: {
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    color: '#10B981',
  },
  vaultBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  balanceCol: {
    flex: 1,
  },
  subBalanceLabel: {
    fontSize: Typography.size.xs,
    color: '#94A3B8',
    fontWeight: Typography.weight.medium,
    marginBottom: 4,
  },
  largeBalanceText: {
    fontSize: 24,
    fontWeight: Typography.weight.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  escrowBalanceText: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: '#E2E8F0',
    letterSpacing: -0.5,
  },
  vaultDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#1E293B',
    marginHorizontal: Spacing.md,
  },
  vaultActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addFundsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A56DB',
    paddingVertical: 11,
    borderRadius: 12,
  },
  addFundsBtnPressed: {
    backgroundColor: '#1E40AF',
  },
  btnIcon: {
    marginRight: 6,
  },
  addFundsText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  withdrawBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  withdrawText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
  },
  sectionSubtext: {
    fontSize: Typography.size.xs,
    color: '#64748B',
    fontWeight: Typography.weight.medium,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: Spacing.xs,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    color: '#1A56DB',
  },
  viewAllText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#1A56DB',
  },
  // Verticals 3-Column Grid
  verticalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  verticalCard: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  verticalCardPressed: {
    opacity: 0.85,
  },
  tradeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  freelanceCard: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  wagerCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  vertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tradeIconBox: {
    backgroundColor: '#DBEAFE',
  },
  freelanceIconBox: {
    backgroundColor: '#F3E8FF',
  },
  wagerIconBox: {
    backgroundColor: '#D1FAE5',
  },
  vertTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  vertDesc: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: Typography.weight.medium,
  },
  escrowList: {
    marginBottom: Spacing.sm,
  },
  // Recent Activity Card
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#0F172A',
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 11,
    color: '#64748B',
  },
  activityAmountPositive: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#059669',
  },
  activityAmountNeutral: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
