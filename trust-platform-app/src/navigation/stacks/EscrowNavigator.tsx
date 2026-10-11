import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { BrowseListingsScreen } from '../../screens/escrow/BrowseListingsScreen';
import { ListingDetailScreen } from '../../screens/escrow/ListingDetailScreen';
import { CreateListingScreen } from '../../screens/escrow/CreateListingScreen';
import { FundEscrowScreen } from '../../screens/escrow/FundEscrowScreen';
import { VerificationStatusScreen } from '../../screens/escrow/VerificationStatusScreen';
import { InspectionWindowScreen } from '../../screens/escrow/InspectionWindowScreen';
import { DisputeFilingScreen } from '../../screens/escrow/DisputeFilingScreen';

const Stack = createNativeStackNavigator<EscrowStackParamList>();

/**
 * EscrowNavigator manages screens within the Digital Goods marketplace & escrow tab.
 */
export const EscrowNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="BrowseListings"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="BrowseListings" component={BrowseListingsScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="FundEscrow" component={FundEscrowScreen} />
      <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <Stack.Screen name="InspectionWindow" component={InspectionWindowScreen} />
      <Stack.Screen name="DisputeFiling" component={DisputeFilingScreen} />
    </Stack.Navigator>
  );
};
