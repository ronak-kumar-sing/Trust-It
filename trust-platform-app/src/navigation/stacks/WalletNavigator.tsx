import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { WalletDashboardScreen } from '../../screens/wallet/WalletDashboardScreen';
import { AddFundsScreen } from '../../screens/wallet/AddFundsScreen';
import { WithdrawFundsScreen } from '../../screens/wallet/WithdrawFundsScreen';
import { TransactionLedgerScreen } from '../../screens/wallet/TransactionLedgerScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

/**
 * WalletNavigator manages the balances dashboard, deposits, withdrawals, and ledger.
 */
export const WalletNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="WalletDashboard"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="WalletDashboard" component={WalletDashboardScreen} />
      <Stack.Screen name="AddFunds" component={AddFundsScreen} />
      <Stack.Screen name="WithdrawFunds" component={WithdrawFundsScreen} />
      <Stack.Screen name="TransactionLedger" component={TransactionLedgerScreen} />
    </Stack.Navigator>
  );
};
