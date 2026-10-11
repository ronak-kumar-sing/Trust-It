import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GamingStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { ChallengeBoardScreen } from '../../screens/gaming/ChallengeBoardScreen';
import { CreateChallengeScreen } from '../../screens/gaming/CreateChallengeScreen';
import { MatchLobbyScreen } from '../../screens/gaming/MatchLobbyScreen';
import { MatchResultScreen } from '../../screens/gaming/MatchResultScreen';
import { CvVerificationScreen } from '../../screens/gaming/CvVerificationScreen';
import { LeaderboardScreen } from '../../screens/gaming/LeaderboardScreen';
import { MatchHistoryScreen } from '../../screens/gaming/MatchHistoryScreen';

const Stack = createNativeStackNavigator<GamingStackParamList>();

/**
 * GamingNavigator manages the challenge board, match lobby, CV verification, and leaderboard.
 */
export const GamingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ChallengeBoard"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="ChallengeBoard" component={ChallengeBoardScreen} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
      <Stack.Screen name="MatchLobby" component={MatchLobbyScreen} />
      <Stack.Screen name="MatchResult" component={MatchResultScreen} />
      <Stack.Screen name="CvVerification" component={CvVerificationScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} />
    </Stack.Navigator>
  );
};
