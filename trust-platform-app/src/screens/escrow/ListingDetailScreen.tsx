import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EscrowStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { DigitalGoodsListing } from '../../types';
import { escrowService } from '../../services/escrowService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<EscrowStackParamList, 'ListingDetail'>;

/**
 * ListingDetailScreen displays seller credibility metrics, 24h inspection guarantees,
 * and the primary call-to-action to fund the escrow lock.
 */
export const ListingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listingId } = route.params;
  const [listing, setListing] = useState<DigitalGoodsListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await escrowService.getListingById(listingId);
      setListing(data);
    } catch {
      setError('Listing not found');
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Header title={Strings.escrow.listingDetail} onBack={() => navigation.goBack()} />
        <LoadingSpinner message="Retrieving listing details..." />
      </ScreenWrapper>
    );
  }

  if (error || !listing) {
    return (
      <ScreenWrapper>
        <Header title={Strings.escrow.listingDetail} onBack={() => navigation.goBack()} />
        <ErrorState
          title="Listing Error"
          message={error ?? 'Not found'}
          onRetry={loadListing}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable>
      <Header
        title={Strings.escrow.listingDetail}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.topMeta}>
        <Badge
          label={listing.isPreVerified ? 'PRE-VERIFIED CREDENTIALS' : 'STANDARD ESCROW'}
          variant={listing.isPreVerified ? 'success' : 'neutral'}
        />
        <Text style={styles.categoryBadge}>{listing.category.replace(/_/g, ' ')}</Text>
      </View>

      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.price}>{formatINR(listing.price)}</Text>

      <Card style={styles.sectionCard} variant="flat">
        <Text style={styles.sectionHeader}>Description & Asset Scope</Text>
        <Text style={styles.descText}>{listing.description}</Text>
      </Card>

      <Card style={styles.sectionCard} variant="elevated">
        <Text style={styles.sectionHeader}>Seller Credibility</Text>
        <View style={styles.sellerRow}>
          <View>
            <Text style={styles.sellerName}>{listing.sellerName}</Text>
            <Text style={styles.sellerTier}>{listing.sellerTier} TIER SELLER</Text>
          </View>
          <View style={styles.sellerScoreBadge}>
            <Text style={styles.sellerScoreNumber}>{listing.sellerScore}</Text>
            <Text style={styles.sellerScoreLabel}>Trust Score</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.guaranteeCard} variant="flat">
        <Text style={styles.guaranteeTitle}>🔒 24-Hour Autonomous Inspection Guarantee</Text>
        <Text style={styles.guaranteeDesc}>
          Your funds are held securely in the TrustVault smart escrow state machine. Credentials
          are revealed only after payment lock. You have 24 hours to inspect and test before funds
          can be released to the seller.
        </Text>
      </Card>

      <View style={styles.actionContainer}>
        <Button
          title={Strings.escrow.fundEscrow}
          onPress={() =>
            navigation.navigate('FundEscrow', {
              listingId: listing.id,
              amount: listing.price,
              title: listing.title,
            })
          }
          variant="primary"
          size="lg"
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.bold,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  descText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sellerTier: {
    fontSize: Typography.size.xs,
    color: Colors.tierGold,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
  },
  sellerScoreBadge: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevatedDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sellerScoreNumber: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
  sellerScoreLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  guaranteeCard: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    marginBottom: Spacing.lg,
  },
  guaranteeTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.info,
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  actionContainer: {
    marginBottom: Spacing.xxl,
  },
});
