import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { AccountSettingsScreen } from '../../screens/settings/AccountSettingsScreen';
import { SecurityScreen } from '../../screens/settings/SecurityScreen';
import { HelpSupportScreen } from '../../screens/settings/HelpSupportScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/**
 * SettingsNavigator manages account preferences, 2FA security, and dispute help.
 */
export const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AccountSettings"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.backgroundDark,
        },
      }}
    >
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="SecurityAuth" component={SecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
};
