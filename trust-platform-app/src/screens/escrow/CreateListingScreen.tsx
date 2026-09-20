import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
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
import { Card } from '../../components/ui/Card';
import { ListingCategory } from '../../types';
import { escrowService } from '../../services/escrowService';

type Props = NativeStackScreenProps<EscrowStackParamList, 'CreateListing'>;

/**
 * CreateListingScreen allows a verified seller to list digital assets,
 * specify encrypted credentials, and deposit credentials to the escrow vault.
 */
export const CreateListingScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [category] = useState<ListingCategory>('DOMAIN_HANDLE');
  const [credentials, setCredentials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const price = parseFloat(priceStr);
    if (!title.trim() || !description.trim() || isNaN(price) || price <= 0 || !credentials.trim()) {
      setError('Please fill in all listing details and credential payload.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await escrowService.createListing({
        title,
        description,
        category,
        price,
        credentialPayload: credentials,
      });
      setIsSubmitting(false);
      navigation.replace('ListingDetail', { listingId: created.id });
    } catch {
      setError('Failed to create listing. Please try again.');
      setIsSubmitting(false);
    }
  }, [title, description, category, priceStr, credentials, navigation]);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.escrow.createListingTitle} onBack={() => navigation.goBack()} />

      <Card style={styles.infoCard} variant="flat">
        <Text style={styles.infoTitle}>Vault-Locked Credentials</Text>
        <Text style={styles.infoDesc}>
          Credentials are encrypted client-side and held in an isolated hardware vault until the buyer
          funds the transaction. AI verification validates the format and access before publication.
        </Text>
      </Card>

      <View style={styles.form}>
        <Input
          label="Asset Title"
          placeholder="e.g. @cyber_domain Handle"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label={Strings.escrow.price}
          placeholder="e.g. 15000"
          value={priceStr}
          onChangeText={setPriceStr}
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Input
          label="Description & Scope"
          placeholder="State age, transfer process, and guarantees..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Input
          label={Strings.escrow.credentialPayload}
          placeholder="Username, transfer auth code, recovery email..."
          value={credentials}
          onChangeText={setCredentials}
          multiline
          secureTextEntry
        />

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <Button
          title="Publish Verified Listing"
          onPress={handleCreate}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  form: {
    marginTop: Spacing.xs,
  },
  errorBanner: {
    color: Colors.danger,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
