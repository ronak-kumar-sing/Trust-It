import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { LeaderboardPlayer } from '../../types';
import { gamingService } from '../../services/gamingService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<GamingStackParamList, 'Leaderboard'>;

/**
 * LeaderboardScreen displays competitive rankings and overall earnings across gaming wagers.
 */
export const LeaderboardScreen: React.FC<Props> = ({ navigation }) => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);

  useEffect(() => {
    gamingService.getLeaderboard().then(setPlayers);
  }, []);

  const renderPlayer = useCallback(
    ({ item }: { item: LeaderboardPlayer }) => (
      <Card style={styles.playerCard} variant="flat">
        <View style={styles.rankBox}>
          <Text
            style={[
              styles.rankText,
              item.rank === 1 && styles.rankOne,
              item.rank === 2 && styles.rankTwo,
              item.rank === 3 && styles.rankThree,
            ]}
          >
            #{item.rank}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.handleText}>{item.handle}</Text>
          <Text style={styles.statsText}>
            {item.matchesPlayed} matches • {item.winRate}% win rate
          </Text>
        </View>

        <View style={styles.earningsBox}>
          <Text style={styles.earningsVal}>{formatINR(item.totalEarnings)}</Text>
          <Text style={styles.scoreText}>{item.trustScore} Trust</Text>
        </View>
      </Card>
    ),
    []
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header title={Strings.gaming.leaderboard} onBack={() => navigation.goBack()} />

      <FlatList
        data={players}
        keyExtractor={(item) => item.userId}
        renderItem={renderPlayer}
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
  playerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rankBox: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textMuted,
  },
  rankOne: {
    color: Colors.tierGold,
    fontSize: Typography.size.base,
  },
  rankTwo: {
    color: Colors.tierSilver,
    fontSize: Typography.size.base,
  },
  rankThree: {
    color: Colors.tierBronze,
    fontSize: Typography.size.base,
  },
  infoBox: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  handleText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  statsText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  earningsBox: {
    alignItems: 'flex-end',
  },
  earningsVal: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
  },
  scoreText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
  },
});
