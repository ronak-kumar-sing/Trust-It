import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelanceStackParamList } from '../../navigation/types';
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
import { FreelanceProject, Milestone } from '../../types';
import { freelanceService } from '../../services/freelanceService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'ProjectDetail'>;

/**
 * ProjectDetailScreen displays the project scope and milestone breakdown.
 */
export const ProjectDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<FreelanceProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await freelanceService.getProjectById(projectId);
      setProject(data);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleMilestonePress = useCallback(
    (milestone: Milestone) => {
      if (milestone.status === 'CLIENT_REVIEW') {
        navigation.navigate('ClientReview', { milestoneId: milestone.id });
      } else if (milestone.status === 'FUNDED') {
        navigation.navigate('SubmitDeliverable', {
          milestoneId: milestone.id,
          title: milestone.title,
        });
      } else if (milestone.status === 'AI_REVIEW') {
        navigation.navigate('QualityGateStatus', { milestoneId: milestone.id });
      } else {
        navigation.navigate('ClientReview', { milestoneId: milestone.id });
      }
    },
    [navigation]
  );

  const renderMilestone = useCallback(
    ({ item }: { item: Milestone }) => {
      const getVariant = (s: Milestone['status']): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
        if (s === 'RELEASED') return 'success';
        if (s === 'CLIENT_REVIEW' || s === 'AI_REVIEW') return 'info';
        if (s === 'FUNDED') return 'warning';
        return 'neutral';
      };

      return (
        <Pressable
          style={({ pressed }) => [styles.msCard, pressed && styles.msCardPressed]}
          onPress={() => handleMilestonePress(item)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.msHeader}>
            <Text style={styles.msTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Badge label={item.status.replace(/_/g, ' ')} variant={getVariant(item.status)} />
          </View>

          <Text style={styles.msCriteria}>{item.acceptanceCriteria}</Text>

          <View style={styles.msFooter}>
            <Text style={styles.msAmount}>{formatINR(item.amount)}</Text>
            {item.reviewDaysRemaining !== undefined && (
              <Text style={styles.msTimer}>⏱️ {item.reviewDaysRemaining} days review remaining</Text>
            )}
          </View>
        </Pressable>
      );
    },
    [handleMilestonePress]
  );

  if (isLoading || !project) {
    return (
      <ScreenWrapper>
        <Header title={Strings.freelance.projectScope} onBack={() => navigation.goBack()} />
        <LoadingSpinner message="Loading milestones..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={project.title}
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="+ Milestone"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('CreateMilestone', { projectId: project.id })}
          />
        }
      />

      <Card style={styles.overviewCard} variant="elevated">
        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.overviewLabel}>Total Project Budget</Text>
            <Text style={styles.overviewBudget}>{formatINR(project.totalBudget)}</Text>
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.overviewLabel}>Contractor</Text>
            <Text style={styles.partnerName}>{project.freelancerName}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.milestonesSection}>
        <Text style={styles.sectionTitle}>Deliverable Milestones</Text>
        <FlatList
          data={project.milestones}
          keyExtractor={(item) => item.id}
          renderItem={renderMilestone}
          contentContainerStyle={styles.milestonesList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  overviewBudget: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
  partnerInfo: {
    alignItems: 'flex-end',
  },
  partnerName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  milestonesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  milestonesList: {
    paddingBottom: Spacing.xxl,
  },
  msCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  msCardPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  msHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  msTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  msCriteria: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.sm,
  },
  msFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  msAmount: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
  msTimer: {
    fontSize: Typography.size.xs,
    color: Colors.info,
    fontWeight: Typography.weight.medium,
  },
});
