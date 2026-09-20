import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DigitalGoodsListing, ListingCategory } from '../../types';
import { escrowService } from '../../services/escrowService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<EscrowStackParamList, 'BrowseListings'>;

const CATEGORIES: { label: string; value?: ListingCategory }[] = [
  { label: 'All' },
  { label: 'Domains & Handles', value: 'DOMAIN_HANDLE' },
  { label: 'API Keys', value: 'API_KEY' },
  { label: 'Gaming Assets', value: 'GAMING_ASSET' },
  { label: 'Social Accounts', value: 'SOCIAL_ACCOUNT' },
];

/**
 * BrowseListingsScreen renders a searchable, filterable FlatList of verified digital assets.
 */
export const BrowseListingsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<DigitalGoodsListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await escrowService.getListings(selectedCategory, searchQuery);
      setListings(data);
    } catch {
      setError('Unable to load listings. Check connection.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const renderListingCard = useCallback(
    ({ item }: { item: DigitalGoodsListing }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${formatINR(item.price)}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.categoryPillText}>{item.category.replace(/_/g, ' ')}</Text>
          {item.isPreVerified ? (
            <Badge label="AI VERIFIED" variant="success" />
          ) : (
            <Badge label="UNVERIFIED" variant="neutral" />
          )}
        </View>

        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listingDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.sellerName}>{item.sellerName}</Text>
            <Text style={styles.sellerScore}>Trust Score: {item.sellerScore}</Text>
          </View>
          <Text style={styles.priceText}>{formatINR(item.price)}</Text>
        </View>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={Strings.escrow.browseTitle}
        rightAction={
          <Button
            title="+ Sell"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('CreateListing')}
          />
        }
      />

      <View style={styles.searchBox}>
        <Input
          placeholder={Strings.common.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
        />
      </View>

      <View style={styles.categoryFilterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.value;
            return (
              <Pressable
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedCategory(item.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading verified listings..." />
      ) : error ? (
        <ErrorState
          title={Strings.common.errorTitle}
          message={error}
          onRetry={loadListings}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          title={Strings.common.emptyTitle}
          description="No digital goods found for this category."
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    marginBottom: Spacing.xs,
  },
  categoryFilterBar: {
    marginVertical: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  listContainer: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryPillText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
  },
  listingTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  listingDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  sellerName: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  sellerScore: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  priceText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
});
