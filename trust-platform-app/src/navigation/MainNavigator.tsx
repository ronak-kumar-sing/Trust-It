import React from 'react';
import { StyleSheet } from 'react-native';
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
 * MainNavigator manages the primary bottom-tab navigation across the platform,
 * styled to match the Stitch TrustVault tab bar with focused/unfocused states.
 */
export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1A56DB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EscrowTab"
        component={EscrowNavigator}
        options={{
          tabBarLabel: 'Escrow',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FreelanceTab"
        component={FreelanceNavigator}
        options={{
          tabBarLabel: 'Freelance',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'briefcase' : 'briefcase-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="GamingTab"
        component={GamingNavigator}
        options={{
          tabBarLabel: 'Gaming',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'game-controller' : 'game-controller-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletNavigator}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.2,
  },
});
