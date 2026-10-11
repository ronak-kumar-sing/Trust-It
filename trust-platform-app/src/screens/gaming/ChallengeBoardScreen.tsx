import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { GamingChallenge, GameTitle } from '../../types';
import { gamingService } from '../../services/gamingService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<GamingStackParamList, 'ChallengeBoard'>;

const GAMES: { label: string; value?: GameTitle }[] = [
  { label: 'All Games' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Valorant', value: 'VALORANT' },
  { label: 'Chess', value: 'CHESS' },
  { label: 'FIFA', value: 'FIFA_24' },
];

/**
 * ChallengeBoardScreen displays active open peer-to-peer wager matches.
 */
export const ChallengeBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedGame, setSelectedGame] = useState<GameTitle | undefined>(undefined);
  const [challenges, setChallenges] = useState<GamingChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await gamingService.getChallenges(selectedGame);
      setChallenges(data);
    } catch {
      setError('Unable to load open challenges');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleJoinChallenge = useCallback(
    async (chal: GamingChallenge) => {
      await gamingService.acceptChallenge(chal.id);
      navigation.navigate('MatchLobby', { challengeId: chal.id });
    },
    [navigation]
  );

  const renderChallenge = useCallback(
    ({ item }: { item: GamingChallenge }) => (
      <Card style={styles.challengeCard} variant="elevated">
        <View style={styles.cardHeader}>
          <View style={styles.gameBadge}>
            <Text style={styles.gameText}>{item.game}</Text>
          </View>
          <View style={styles.prizeBox}>
            <Text style={styles.prizeLabel}>Prize Pool</Text>
            <Text style={styles.prizeVal}>{formatINR(item.prizePool)}</Text>
          </View>
        </View>

        <View style={styles.hostRow}>
          <Text style={styles.hostName}>Host: {item.creatorName}</Text>
          <Text style={styles.hostScore}>Trust Score: {item.creatorScore}</Text>
        </View>

        <Text style={styles.rulesText} numberOfLines={2}>
          Rules: {item.rules}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.stakeLabel}>Stake Required</Text>
            <Text style={styles.stakeAmount}>{formatINR(item.stakeAmount)}</Text>
          </View>

          <Button
            title="Accept & Lock Wager"
            variant="primary"
            size="sm"
            onPress={() => handleJoinChallenge(item)}
          />
        </View>
      </Card>
    ),
    [handleJoinChallenge]
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={Strings.gaming.challengeBoard}
        rightAction={
          <View style={styles.headerActions}>
            <Button
              title="Rankings"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('Leaderboard')}
            />
            <Button
              title="+ Host"
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate('CreateChallenge')}
            />
          </View>
        }
      />

      <View style={styles.gameFilterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GAMES}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = selectedGame === item.value;
            return (
              <Pressable
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedGame(item.value)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Scanning matchmaking pool..." />
      ) : error ? (
        <ErrorState
          title={Strings.common.errorTitle}
          message={error}
          onRetry={loadChallenges}
        />
      ) : challenges.length === 0 ? (
        <EmptyState
          title="No Open Wagers"
          description="Host a match and set your stakes to challenge the community."
        />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gameFilterBar: {
    marginVertical: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  listContainer: {
    paddingBottom: Spacing.xxl,
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  gameBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gameText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  prizeBox: {
    alignItems: 'flex-end',
  },
  prizeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  prizeVal: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hostName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  hostScore: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  rulesText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  stakeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  stakeAmount: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
  },
});
