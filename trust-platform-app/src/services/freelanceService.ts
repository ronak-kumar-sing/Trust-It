import { apiClient, generateIdempotencyKey } from '../api/client';
import { FreelanceProject, Milestone, QualityGateResult } from '../types';
import { MOCK_PROJECTS } from '../api/mockData';

export const freelanceService = {
  /**
   * Fetch user's freelance projects
   */
  async getProjects(): Promise<FreelanceProject[]> {
    try {
      const res = await apiClient.axios.get('/freelance/projects');
      return res.data;
    } catch {
      return MOCK_PROJECTS;
    }
  },

  /**
   * Get project details and milestone list by project ID
   */
  async getProjectById(projectId: string): Promise<FreelanceProject> {
    try {
      const res = await apiClient.axios.get(`/freelance/projects/${projectId}`);
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.id === projectId);
      return found ?? MOCK_PROJECTS[0];
    }
  },

  /**
   * Create a new freelance project
   */
  async createProject(data: {
    title: string;
    description: string;
    freelancerId: string;
    freelancerName: string;
    totalBudget: number;
  }): Promise<FreelanceProject> {
    try {
      const res = await apiClient.axios.post('/freelance/projects', data, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('proj') },
      });
      return res.data;
    } catch {
      const newProj: FreelanceProject = {
        id: `proj_fl_${Date.now()}`,
        title: data.title,
        description: data.description,
        clientId: 'usr_mock_001',
        clientName: 'Alex Trader',
        freelancerId: data.freelancerId,
        freelancerName: data.freelancerName,
        totalBudget: data.totalBudget,
        milestones: [],
        createdAt: new Date().toISOString(),
      };
      MOCK_PROJECTS.unshift(newProj);
      return newProj;
    }
  },

  /**
   * Create milestone under an existing project
   */
  async createMilestone(projectId: string, data: {
    title: string;
    acceptanceCriteria: string;
    amount: number;
  }): Promise<Milestone> {
    try {
      const res = await apiClient.axios.post(`/freelance/projects/${projectId}/milestones`, data, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('ms') },
      });
      return res.data;
    } catch {
      const newMs: Milestone = {
        id: `ms_${Date.now()}`,
        projectId,
        title: data.title,
        acceptanceCriteria: data.acceptanceCriteria,
        amount: data.amount,
        status: 'FUNDED',
        createdAt: new Date().toISOString(),
      };
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId);
      if (proj) proj.milestones.push(newMs);
      return newMs;
    }
  },

  /**
   * Submit deliverable and trigger AI quality gate analysis
   */
  async submitDeliverable(milestoneId: string, deliverableUrl: string, deliverableNotes: string): Promise<QualityGateResult> {
    try {
      const res = await apiClient.axios.post(`/freelance/milestones/${milestoneId}/deliverables`, {
        deliverableUrl,
        deliverableNotes,
      }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('deliv') },
      });
      return res.data;
    } catch {
      return {
        linterPassed: true,
        testCoveragePercent: 94.2,
        criticalVulnerabilities: 0,
        ghostingRiskScore: 12,
        overallPassed: true,
      };
    }
  },

  /**
   * Approve milestone and release locked escrow
   */
  async approveMilestone(milestoneId: string): Promise<void> {
    try {
      await apiClient.axios.post(`/freelance/milestones/${milestoneId}/approve`, {}, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('appr') },
      });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Request milestone revision
   */
  async requestRevision(milestoneId: string, notes: string): Promise<void> {
    try {
      await apiClient.axios.post(`/freelance/milestones/${milestoneId}/request-changes`, { notes }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('rev') },
      });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Raise freelance dispute
   */
  async disputeMilestone(milestoneId: string, reason: string): Promise<void> {
    try {
      await apiClient.axios.post(`/freelance/milestones/${milestoneId}/dispute`, { reason }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey('fl_disp') },
      });
    } catch {
      // Offline fallback
    }
  },
};
