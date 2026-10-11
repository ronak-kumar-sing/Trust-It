import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
  { label: 'Gaming Accounts', value: 'GAMING_ASSET' },
  { label: 'Social Handles', value: 'SOCIAL_ACCOUNT' },
];

/**
 * BrowseListingsScreen renders the Stitch-styled Digital Goods Marketplace:
 * contextual header with safety subtitle, category pills, search with filter toggle,
 * and high-craft listing cards with AI sandbox verification and insurance badges.
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
        {/* Top Badges Row */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.category.replace(/_/g, ' ')}
            </Text>
          </View>

          {item.isPreVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" style={styles.verifiedIcon} />
              <Text style={styles.verifiedBadgeText}>AI SANDBOX VERIFIED</Text>
            </View>
          ) : (
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedBadgeText}>STANDARD ESCROW</Text>
            </View>
          )}
        </View>

        {/* Title and Description */}
        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listingDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Insurance Banner */}
        <View style={styles.insuranceBanner}>
          <Ionicons name="lock-closed" size={12} color="#059669" style={styles.insuranceIcon} />
          <Text style={styles.insuranceText}>30-Day Recovery Insurance Active</Text>
        </View>

        {/* Seller Info and Price */}
        <View style={styles.cardFooter}>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {item.sellerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.sellerName}>{item.sellerName}</Text>
              <View style={styles.trustPill}>
                <Ionicons name="shield-checkmark" size={10} color="#059669" />
                <Text style={styles.trustScoreText}>Score {item.sellerScore}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.escrowSublabel}>Shielded Escrow</Text>
            <Text style={styles.priceText}>{formatINR(item.price)}</Text>
          </View>
        </View>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <ScreenWrapper scrollable={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{Strings.escrow.browseTitle}</Text>
          <View style={styles.safetySubtitleRow}>
            <View style={styles.safetyDot} />
            <Text style={styles.safetySubtitle}>AI-Sandboxed & Escrow-Protected</Text>
          </View>
        </View>

        <Button
          title="+ Sell"
          variant="primary"
          size="sm"
          onPress={() => navigation.navigate('CreateListing')}
        />
      </View>

      {/* Search Bar & Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Input
            placeholder={Strings.common.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search-outline"
          />
        </View>
      </View>

      {/* Category Pills */}
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
                style={({ pressed }) => [
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                  pressed && styles.filterChipPressed,
                ]}
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

      {/* Content List */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  safetySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 6,
  },
  safetySubtitle: {
    fontSize: 11,
    fontWeight: Typography.weight.semibold,
    color: '#059669',
  },
  searchRow: {
    marginBottom: Spacing.xs,
  },
  searchInputWrapper: {
    flex: 1,
  },
  categoryFilterBar: {
    marginVertical: Spacing.sm,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipPressed: {
    backgroundColor: '#F1F5F9',
  },
  filterChipSelected: {
    backgroundColor: '#1A56DB',
    borderColor: '#1A56DB',
  },
  filterChipText: {
    fontSize: Typography.size.xs,
    color: '#475569',
    fontWeight: Typography.weight.semibold,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#1A56DB',
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedIcon: {
    marginRight: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: Typography.weight.extrabold,
    letterSpacing: 0.5,
  },
  unverifiedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unverifiedBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  listingTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  listingDesc: {
    fontSize: Typography.size.xs,
    color: '#64748B',
    lineHeight: Typography.lineHeight.xs * 1.35,
    marginBottom: Spacing.sm,
  },
  insuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: Spacing.sm,
  },
  insuranceIcon: {
    marginRight: 5,
  },
  insuranceText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: Typography.weight.semibold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  sellerAvatarText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#1A56DB',
  },
  sellerName: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustScoreText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: Typography.weight.bold,
    marginLeft: 3,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  escrowSublabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: Typography.weight.medium,
    marginBottom: 2,
  },
  priceText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.extrabold,
    color: '#0F172A',
  },
});
