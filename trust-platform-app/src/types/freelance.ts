/**
 * Domain types for Freelance Escrow, Projects, and Quality Gates.
 */

export type MilestoneStatus =
  | 'PENDING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'AI_REVIEW'
  | 'CLIENT_REVIEW'
  | 'REVISION_REQUESTED'
  | 'RELEASED'
  | 'DISPUTED';

export interface QualityGateResult {
  linterPassed: boolean;
  testCoveragePercent: number;
  criticalVulnerabilities: number;
  ghostingRiskScore: number; // 0 - 100 (lower is better)
  overallPassed: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  acceptanceCriteria: string;
  amount: number;
  status: MilestoneStatus;
  deliverableUrl?: string;
  deliverableNotes?: string;
  qualityGate?: QualityGateResult;
  reviewDaysRemaining?: number;
  createdAt: string;
}

export interface FreelanceProject {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  totalBudget: number;
  milestones: Milestone[];
  createdAt: string;
}
