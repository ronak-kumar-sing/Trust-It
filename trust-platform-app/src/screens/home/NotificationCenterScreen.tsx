import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { NotificationItem } from '../../types';
import { homeService } from '../../services/homeService';
import { MOCK_NOTIFICATIONS } from '../../api/mockData';
import { formatDate } from '../../utils/formatters';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotificationCenter'>;

/**
 * NotificationCenterScreen displays incoming platform alerts,
 * state change notifications, and audit warnings.
 */
export const NotificationCenterScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const handleMarkAllRead = useCallback(async () => {
    await homeService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleItemPress = useCallback((item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Pressable
        style={[styles.itemCard, !item.read && styles.itemCardUnread]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.titleRow}>
            {!item.read && <View style={styles.unreadDot} />}
            <Text style={styles.itemTitle}>{item.title}</Text>
          </View>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={styles.itemBody}>{item.body}</Text>
      </Pressable>
    ),
    [handleItemPress]
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title="Notification Center"
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="Mark All Read"
            variant="ghost"
            size="sm"
            onPress={handleMarkAllRead}
          />
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You're all caught up with your escrow activity."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Spacing.xl,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  itemCardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceHighlight,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  itemDate: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  itemBody: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
});
