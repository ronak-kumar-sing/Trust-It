import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeAreaEdges?: readonly Edge[];
}

/**
 * Common screen wrapper ensuring proper Safe Area insets and dark OLED background.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = React.memo(({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  safeAreaEdges = ['top', 'left', 'right'] as readonly Edge[],
}) => {
  const containerStyle: ViewStyle[] = [styles.container, style ?? {}];

  return (
    <SafeAreaView edges={safeAreaEdges} style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                colors={[Colors.primary]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={Colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
});

ScreenWrapper.displayName = 'ScreenWrapper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.massive,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
});
