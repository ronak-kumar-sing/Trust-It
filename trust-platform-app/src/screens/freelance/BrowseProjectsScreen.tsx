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
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FreelanceProject } from '../../types';
import { freelanceService } from '../../services/freelanceService';
import { formatINR } from '../../utils/formatters';

type Props = NativeStackScreenProps<FreelanceStackParamList, 'BrowseProjects'>;

/**
 * BrowseProjectsScreen displays client & contractor freelance escrow contracts.
 */
export const BrowseProjectsScreen: React.FC<Props> = ({ navigation }) => {
  const [projects, setProjects] = useState<FreelanceProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await freelanceService.getProjects();
      setProjects(data);
    } catch {
      setError('Unable to load freelance projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const renderProject = useCallback(
    ({ item }: { item: FreelanceProject }) => {
      const completedMilestones = item.milestones.filter((m) => m.status === 'RELEASED').length;
      return (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.contractorLabel}>Freelancer: {item.freelancerName}</Text>
            <Text style={styles.budgetVal}>{formatINR(item.totalBudget)}</Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.milestoneProgress}>
            <Text style={styles.progressText}>
              Milestones: {completedMilestones} / {item.milestones.length} Completed
            </Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${
                      item.milestones.length > 0
                        ? (completedMilestones / item.milestones.length) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation]
  );

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={Strings.freelance.projectsTitle}
        rightAction={
          <Button
            title="+ New Scope"
            variant="primary"
            size="sm"
            onPress={() => {
              // Create demo project or navigate
              navigation.navigate('ProjectDetail', { projectId: 'proj_fl_201' });
            }}
          />
        }
      />

      <Card style={styles.qualityGateBanner} variant="flat">
        <Text style={styles.gateBannerTitle}>🤖 Automated AI Quality Gates Active</Text>
        <Text style={styles.gateBannerDesc}>
          Milestone deliverables are checked for test coverage, vulnerabilities, and code drift
          before client 14-day review countdown triggers.
        </Text>
      </Card>

      {isLoading ? (
        <LoadingSpinner message="Fetching freelance contracts..." />
      ) : error ? (
        <ErrorState
          title={Strings.common.errorTitle}
          message={error}
          onRetry={loadProjects}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No Freelance Projects"
          description="Create your first milestone-based escrow project."
        />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  qualityGateBanner: {
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.25)',
    marginBottom: Spacing.md,
  },
  gateBannerTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  gateBannerDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
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
    marginBottom: 4,
  },
  contractorLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  budgetVal: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryLight,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs * 1.3,
    marginBottom: Spacing.sm,
  },
  milestoneProgress: {
    marginTop: Spacing.xs,
  },
  progressText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  barBg: {
    height: 5,
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
});
