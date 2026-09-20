import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FreelanceStackParamList } from '../types';
import { Colors } from '../../constants/colors';
import { BrowseProjectsScreen } from '../../screens/freelance/BrowseProjectsScreen';
import { ProjectDetailScreen } from '../../screens/freelance/ProjectDetailScreen';
import { CreateMilestoneScreen } from '../../screens/freelance/CreateMilestoneScreen';
import { SubmitDeliverableScreen } from '../../screens/freelance/SubmitDeliverableScreen';
import { QualityGateStatusScreen } from '../../screens/freelance/QualityGateStatusScreen';
import { ClientReviewScreen } from '../../screens/freelance/ClientReviewScreen';
import { FreelanceDisputeScreen } from '../../screens/freelance/FreelanceDisputeScreen';

const Stack = createNativeStackNavigator<FreelanceStackParamList>();

/**
 * FreelanceNavigator manages the freelance contracts, quality gate, and review screens.
 */
export const FreelanceNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="BrowseProjects"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.backgroundDark,
        },
      }}
    >
      <Stack.Screen name="BrowseProjects" component={BrowseProjectsScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="CreateMilestone" component={CreateMilestoneScreen} />
      <Stack.Screen name="SubmitDeliverable" component={SubmitDeliverableScreen} />
      <Stack.Screen name="QualityGateStatus" component={QualityGateStatusScreen} />
      <Stack.Screen name="ClientReview" component={ClientReviewScreen} />
      <Stack.Screen name="FreelanceDispute" component={FreelanceDisputeScreen} />
    </Stack.Navigator>
  );
};
