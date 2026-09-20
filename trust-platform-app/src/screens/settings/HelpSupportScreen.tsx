import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Strings } from '../../constants/strings';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<SettingsStackParamList, 'HelpSupport'>;

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does the 24-hour inspection window work?',
    answer:
      'When you purchase a digital asset, your payment is locked in escrow while credentials are moved into your secure vault. You have exactly 24 hours to test access. If satisfied, release funds or wait for auto-release; if compromised, file a dispute before the timer expires.',
  },
  {
    question: 'What happens if a freelance contractor ghosts?',
    answer:
      'Our autonomous ghosting risk algorithm monitors repo activity. If milestones are overdue and the contractor remains unresponsive, the client can activate the Continuity Pool to transfer the funded milestone to a peer-vetted alternative engineer.',
  },
  {
    question: 'How does Computer Vision verify gaming match outcomes?',
    answer:
      'Both players submit end-game victory/defeat screenshots. Our CV model runs OCR, checks EXIF metadata, evaluates tamper signatures, and cross-references scoreboard data to confirm victory and automatically distribute the prize pool.',
  },
];

/**
 * HelpSupportScreen guides users through dispute arbitration and common questions.
 */
export const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);

  const toggleFaq = useCallback((idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <ScreenWrapper scrollable>
      <Header title={Strings.settings.helpSupport} onBack={() => navigation.goBack()} />

      <Card style={styles.disputeProcessCard} variant="elevated">
        <Text style={styles.disputeTitle}>{Strings.settings.disputeTiers}</Text>
        <Text style={styles.tierStep}>
          <Text style={styles.bold}>Tier 1 (Instant):</Text> Autonomous AI Arbiter checks API logs, git commits, or match OCR screenshots.
        </Text>
        <Text style={styles.tierStep}>
          <Text style={styles.bold}>Tier 2 (24 Hours):</Text> Direct peer mediation room with automated evidence comparison.
        </Text>
        <Text style={styles.tierStep}>
          <Text style={styles.bold}>Tier 3 (Final):</Text> Decentralized Community Jury vote where verified Gold Tier members vote to release or refund.
        </Text>
      </Card>

      <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

      <View style={styles.faqList}>
        {FAQS.map((faq, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <Card key={i} style={styles.faqCard} variant="flat">
              <Pressable onPress={() => toggleFaq(i)}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqIcon}>{isExpanded ? '−' : '+'}</Text>
                </View>
              </Pressable>

              {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </Card>
          );
        })}
      </View>

      <View style={styles.supportBox}>
        {ticketSent ? (
          <Card style={styles.ticketCard} variant="flat">
            <Text style={styles.ticketTitle}>✓ Priority Support Ticket Created</Text>
            <Text style={styles.ticketDesc}>
              A dispute specialist has been assigned. Expect response in &lt; 15 minutes.
            </Text>
          </Card>
        ) : (
          <Button
            title="Open 24/7 Priority Support Ticket"
            onPress={() => setTicketSent(true)}
            variant="primary"
            size="lg"
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  disputeProcessCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  disputeTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tierStep: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  bold: {
    color: Colors.primaryLight,
    fontWeight: Typography.weight.bold,
  },
  sectionHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  faqList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqIcon: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    fontWeight: Typography.weight.bold,
  },
  faqAnswer: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeight.xs * 1.3,
  },
  supportBox: {
    marginBottom: Spacing.xxl,
  },
  ticketCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    marginBottom: 2,
  },
  ticketDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
