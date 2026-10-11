import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { NotificationCenterScreen } from '../../screens/home/NotificationCenterScreen';
import { TrustScoreDetailScreen } from '../../screens/home/TrustScoreDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * HomeNavigator manages screens within the Home tab.
 */
export const HomeNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeDashboard"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="HomeDashboard" component={HomeScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <Stack.Screen name="TrustScoreDetail" component={TrustScoreDetailScreen} />
    </Stack.Navigator>
  );
};
