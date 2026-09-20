import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { HomeNavigator } from './stacks/HomeNavigator';
import { EscrowNavigator } from './stacks/EscrowNavigator';
import { FreelanceNavigator } from './stacks/FreelanceNavigator';
import { GamingNavigator } from './stacks/GamingNavigator';
import { WalletNavigator } from './stacks/WalletNavigator';
import { SettingsNavigator } from './stacks/SettingsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * MainNavigator manages the primary bottom-tab navigation across the platform.
 */
export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EscrowTab"
        component={EscrowNavigator}
        options={{
          tabBarLabel: 'Escrow',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="key" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FreelanceTab"
        component={FreelanceNavigator}
        options={{
          tabBarLabel: 'Freelance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GamingTab"
        component={GamingNavigator}
        options={{
          tabBarLabel: 'Gaming',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletNavigator}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundDark,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.semibold,
  },
});
