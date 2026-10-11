import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { Avatar } from '../../components/ui/Avatar';
import { CountdownTimer } from '../../components/domain/CountdownTimer';

type Props = NativeStackScreenProps<GamingStackParamList, 'MatchLobby'>;

/**
 * MatchLobbyScreen displays players confirmed, locked prize pool, and room codes.
 */
export const MatchLobbyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { challengeId } = route.params;

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.gaming.matchLobby} onBack={() => navigation.goBack()} />

      <CountdownTimer
        initialSeconds={15 * 60}
        label="Match Window Countdown"
      />

      <Card style={styles.prizeCard} variant="elevated">
        <Text style={styles.prizeLabel}>Locked Wager Prize Pool</Text>
        <Text style={styles.prizeValue}>₹1,980</Text>
        <Text style={styles.feeNote}>Escrow locked (2x ₹1,000 stakes minus 1% fee)</Text>
      </Card>

      <View style={styles.vsContainer}>
        <View style={styles.playerColumn}>
          <Avatar name="Shadow Ops" size="lg" />
          <Text style={styles.playerName}>ShadowOps (Host)</Text>
          <Text style={styles.playerScore}>820 Trust</Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.playerColumn}>
          <Avatar name="Alex Trader" size="lg" badge="verified" />
          <Text style={styles.playerName}>Alex Trader (You)</Text>
          <Text style={styles.playerScore}>845 Trust</Text>
        </View>
      </View>

      <Card style={styles.roomCodeCard} variant="flat">
        <Text style={styles.roomLabel}>Game Lobby Room Code</Text>
        <Text style={styles.roomCode}>ROOM_9821_VAULT</Text>
        <Text style={styles.roomHint}>
          Enter this room code in BGMI Custom Match lobby. Take a screenshot of the victory or defeat
          screen when completed.
        </Text>
      </Card>

      <View style={styles.actionContainer}>
        <Button
          title={Strings.gaming.reportResult}
          onPress={() => navigation.navigate('MatchResult', { challengeId })}
          variant="primary"
          size="lg"
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  prizeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  prizeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prizeValue: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.success,
    marginVertical: 4,
  },
  feeNote: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  vsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  playerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  playerScore: {
    fontSize: Typography.size.xs,
    color: Colors.tierGold,
    marginTop: 2,
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: Colors.white,
    fontWeight: Typography.weight.extrabold,
    fontSize: Typography.size.sm,
  },
  roomCodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  roomLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  roomCode: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.mono,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  roomHint: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actionContainer: {
    marginBottom: Spacing.xxl,
  },
});
