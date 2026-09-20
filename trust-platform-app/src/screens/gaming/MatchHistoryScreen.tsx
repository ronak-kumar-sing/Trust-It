import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<GamingStackParamList, 'MatchHistory'>;

interface MatchHistoryItem {
  id: string;
  game: string;
  opponent: string;
  won: boolean;
  stake: number;
  payout: number;
  date: string;
}

const MOCK_HISTORY: MatchHistoryItem[] = [
  {
    id: 'm1',
    game: 'BGMI',
    opponent: 'ShadowOps',
    won: true,
    stake: 1000,
    payout: 1980,
    date: 'Today, 02:40 PM',
  },
  {
    id: 'm2',
    game: 'VALORANT',
    opponent: 'ViperSniper',
    won: false,
    stake: 2500,
    payout: 0,
    date: 'Yesterday, 08:15 PM',
  },
  {
    id: 'm3',
    game: 'CHESS',
    opponent: 'GrandmasterX',
    won: true,
    stake: 5000,
    payout: 9900,
    date: '18 Sep, 04:30 PM',
  },
];

/**
 * MatchHistoryScreen displays historical wager matches, win/loss records, and earnings.
 */
export const MatchHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [history] = useState<MatchHistoryItem[]>(MOCK_HISTORY);

  const renderItem = useCallback(
    ({ item }: { item: MatchHistoryItem }) => (
      <Card style={styles.card} variant="flat">
        <View style={styles.header}>
          <Text style={styles.gameTitle}>{item.game} 1v1</Text>
          <Badge
            label={item.won ? 'VICTORY' : 'DEFEAT'}
            variant={item.won ? 'success' : 'danger'}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.opponent}>vs {item.opponent}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.stakeText}>Stake: {formatINR(item.stake)}</Text>
          <Text style={[styles.payoutText, item.won ? styles.payoutWin : styles.payoutLoss]}>
            {item.won ? `+${formatINR(item.payout)}` : `-${formatINR(item.stake)}`}
          </Text>
        </View>
      </Card>
    ),
    []
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header title="Match History" onBack={() => navigation.goBack()} />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  opponent: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.xs,
  },
  stakeText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  payoutText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
  },
  payoutWin: {
    color: Colors.success,
  },
  payoutLoss: {
    color: Colors.danger,
  },
});
