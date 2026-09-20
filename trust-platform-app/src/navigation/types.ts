import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  Kyc: undefined;
  ProfileSetup: undefined;
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  NotificationCenter: undefined;
  TrustScoreDetail: undefined;
};

export type EscrowStackParamList = {
  BrowseListings: undefined;
  ListingDetail: { listingId: string };
  CreateListing: undefined;
  FundEscrow: { listingId: string; amount: number; title: string };
  VerificationStatus: { escrowId: string };
  InspectionWindow: { escrowId: string };
  DisputeFiling: { escrowId: string };
};

export type FreelanceStackParamList = {
  BrowseProjects: undefined;
  ProjectDetail: { projectId: string };
  CreateMilestone: { projectId: string };
  SubmitDeliverable: { milestoneId: string; title: string };
  QualityGateStatus: { milestoneId: string };
  ClientReview: { milestoneId: string };
  RevisionRequest: { milestoneId: string };
  FreelanceDispute: { milestoneId: string };
};

export type GamingStackParamList = {
  ChallengeBoard: undefined;
  CreateChallenge: undefined;
  MatchLobby: { challengeId: string };
  MatchResult: { challengeId: string };
  CvVerification: { matchId: string };
  MatchCompletePayout: { matchId: string; won: boolean; payout: number };
  MatchHistory: undefined;
  Leaderboard: undefined;
};

export type WalletStackParamList = {
  WalletDashboard: undefined;
  AddFunds: undefined;
  WithdrawFunds: undefined;
  TransactionLedger: undefined;
};

export type SettingsStackParamList = {
  AccountSettings: undefined;
  SecurityAuth: undefined;
  HelpSupport: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  EscrowTab: NavigatorScreenParams<EscrowStackParamList>;
  FreelanceTab: NavigatorScreenParams<FreelanceStackParamList>;
  GamingTab: NavigatorScreenParams<GamingStackParamList>;
  WalletTab: NavigatorScreenParams<WalletStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
