import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GameTitle } from '../../types';
import { gamingService } from '../../services/gamingService';

type Props = NativeStackScreenProps<GamingStackParamList, 'CreateChallenge'>;

const GAME_OPTIONS: { title: string; key: GameTitle }[] = [
  { title: 'BGMI Mobile', key: 'BGMI' },
  { title: 'Valorant', key: 'VALORANT' },
  { title: 'Chess.com', key: 'CHESS' },
  { title: 'FIFA 24', key: 'FIFA_24' },
];

/**
 * CreateChallengeScreen allows a host to set game, stake amount, and match rules.
 */
export const CreateChallengeScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedGame, setSelectedGame] = useState<GameTitle>('BGMI');
  const [stakeStr, setStakeStr] = useState('1000');
  const [rules, setRules] = useState('TDM Warehouse 1v1. M416 only. No grenades. First to 15.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const stake = parseFloat(stakeStr);
    if (isNaN(stake) || stake <= 0 || !rules.trim()) {
      setError('Please provide a valid stake amount and match rules.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await gamingService.createChallenge({
        game: selectedGame,
        stakeAmount: stake,
        rules,
      });
      setIsSubmitting(false);
      navigation.replace('MatchLobby', { challengeId: created.id });
    } catch {
      setError('Failed to host challenge.');
      setIsSubmitting(false);
    }
  }, [selectedGame, stakeStr, rules, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.gaming.createChallenge} onBack={() => navigation.goBack()} />

      <Card style={styles.escrowNotice} variant="flat">
        <Text style={styles.escrowTitle}>Peer-to-Peer Escrow Lock</Text>
        <Text style={styles.escrowText}>
          Hosting a challenge locks your stake amount into escrow. When an opponent accepts, both
          stakes are secured into the winner-takes-all prize pool (minus 1% platform fee).
        </Text>
      </Card>

      <Text style={styles.label}>{Strings.gaming.gameSelect}</Text>
      <View style={styles.gameGrid}>
        {GAME_OPTIONS.map((g) => {
          const isSelected = selectedGame === g.key;
          return (
            <Pressable
              key={g.key}
              style={[styles.gameCard, isSelected && styles.gameCardSelected]}
              onPress={() => setSelectedGame(g.key)}
            >
              <Text style={[styles.gameCardText, isSelected && styles.gameCardTextSelected]}>
                {g.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.form}>
        <Input
          label={Strings.gaming.stakeAmount}
          placeholder="e.g. 1000"
          value={stakeStr}
          onChangeText={setStakeStr}
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Input
          label="Match Rules & Win Conditions"
          placeholder="State map, allowable weapons, rounds to win..."
          value={rules}
          onChangeText={setRules}
          multiline
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Lock Stake & Post Wager"
          onPress={handleCreate}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  escrowNotice: {
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.25)',
    marginBottom: Spacing.md,
  },
  escrowTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  escrowText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gameCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexBasis: '48%',
    alignItems: 'center',
  },
  gameCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(26, 86, 219, 0.15)',
  },
  gameCardText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  gameCardTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  form: {
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
