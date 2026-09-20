import type {
  ProjectStatusType,
  MilestoneStatusType,
} from '../../domain/enums/ProjectStatus.js';
import type { EscrowDetailsDTO } from './escrow.dto.js';

export interface CreateProjectDTO {
  clientId: string;
  freelancerId: string;
  title: string;
  description?: string;
  totalBudget: number;
}

export interface MilestoneDTO {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  sowText: string;
  status: MilestoneStatusType;
  qualityGateResult: Record<string, unknown> | null;
  submissionUrl: string | null;
  revisionCount: number;
  escrowTransactionId: string | null;
  reviewDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string;
  totalBudget: number;
  status: ProjectStatusType;
  milestones?: MilestoneDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneDTO {
  projectId: string;
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  sowText?: string;
}

export interface FundMilestoneDTO {
  milestoneId: string;
  clientId: string;
}

export interface FundMilestoneResultDTO {
  milestone: MilestoneDTO;
  escrow: EscrowDetailsDTO;
}

export interface SubmitMilestoneDTO {
  milestoneId: string;
  freelancerId: string;
  submissionUrl: string;
}

export interface RequestChangesDTO {
  milestoneId: string;
  clientId: string;
  feedback: string;
}
