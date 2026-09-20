import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Kyc'>;

/**
 * KycScreen handles identity verification documentation (Aadhaar/PAN).
 */
export const KycScreen: React.FC<Props> = ({ navigation }) => {
  const [docNumber, setDocNumber] = useState('5489 1234 8876');
  const [docUploaded, setDocUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateKyc } = useAuthStore();

  const handleUploadDoc = useCallback(() => {
    setDocUploaded(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
      updateKyc('VERIFIED', 'GOLD');
      setIsSubmitting(false);
      navigation.navigate('ProfileSetup');
    }, 800);
  }, [updateKyc, navigation]);

  const handleSkip = useCallback(() => {
    updateKyc('PENDING', 'BRONZE');
    navigation.navigate('ProfileSetup');
  }, [updateKyc, navigation]);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{Strings.auth.kycTitle}</Text>
          <Text style={styles.subtitle}>{Strings.auth.kycSubtitle}</Text>
        </View>

        <Card style={styles.benefitCard} variant="elevated">
          <Text style={styles.benefitHeader}>Gold Tier Privileges:</Text>
          <Text style={styles.benefitItem}>• ₹5,00,000 single escrow limit</Text>
          <Text style={styles.benefitItem}>• Instant dispute arbitration queue priority</Text>
          <Text style={styles.benefitItem}>• Zero deposit holding periods</Text>
        </Card>

        <View style={styles.form}>
          <Input
            label={Strings.auth.aadhaarLabel}
            placeholder="XXXX XXXX XXXX"
            value={docNumber}
            onChangeText={setDocNumber}
            keyboardType="number-pad"
            leftIcon="card-outline"
          />

          <View style={styles.uploadBox}>
            <Text style={styles.uploadTitle}>{Strings.auth.documentUpload}</Text>
            <Text style={styles.uploadDesc}>Aadhaar Card, PAN Card or Passport (PDF/JPEG)</Text>
            <Button
              title={docUploaded ? '✓ Document Attached' : 'Select Document'}
              variant={docUploaded ? 'secondary' : 'outline'}
              size="md"
              onPress={handleUploadDoc}
              icon={docUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
            />
          </View>

          <Button
            title="Verify & Continue"
            onPress={handleSubmit}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />

          <Button
            title="Complete Later (Bronze Limits)"
            onPress={handleSkip}
            variant="ghost"
            size="md"
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  benefitCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tierGold,
  },
  benefitHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.tierGold,
    marginBottom: 4,
  },
  benefitItem: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  form: {
    marginTop: Spacing.sm,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  uploadTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  uploadDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
