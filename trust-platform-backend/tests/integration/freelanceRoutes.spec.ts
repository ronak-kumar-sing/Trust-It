import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { Project } from '../../src/domain/entities/Project.js';
import { Milestone } from '../../src/domain/entities/Milestone.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IProjectRepository,
  IMilestoneRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IEscrowQueue,
} from '../../src/application/interfaces/index.js';

describe('Freelance Milestone Escrow Routes Integration', () => {
  let app: FastifyInstance;

  const clientId = '11111111-2222-3333-4444-555555555555';
  const freelancerId = '66666666-7777-8888-9999-000000000000';

  const projectsDb = new Map<string, Project>();
  const milestonesDb = new Map<string, Milestone>();
  const escrowsDb = new Map<string, EscrowTransaction>();
  const walletsDb = new Map<string, Wallet>();
  const ledgersDb: TransactionLedger[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      if (id === clientId) return User.create(clientId, 'client@freelance.io', null, 'email');
      if (id === freelancerId) return User.create(freelancerId, 'freelancer@freelance.io', null, 'email');
      return null;
    },
    async findByEmail() { return null; },
    async findByPhone() { return null; },
    async create() {},
    async update() {},
  };

  const mockWalletRepo: IWalletRepository = {
    async findById(id: string) { return walletsDb.get(id) ?? null; },
    async findByUserId(userId: string) {
      for (const w of walletsDb.values()) {
        if (w.userId === userId) return w;
      }
      return null;
    },
    async create(w: Wallet) { walletsDb.set(w.id, w); },
    async save(w: Wallet) { walletsDb.set(w.id, w); },
  };

  const mockEscrowRepo: IEscrowRepository = {
    async findById(id: string) { return escrowsDb.get(id) ?? null; },
    async findByBuyerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.buyerId === id);
    },
    async findBySellerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.sellerId === id);
    },
    async create(e: EscrowTransaction) { escrowsDb.set(e.id, e); },
    async save(e: EscrowTransaction) { escrowsDb.set(e.id, e); },
  };

  const mockProjectRepo: IProjectRepository = {
    async findById(id: string) { return projectsDb.get(id) ?? null; },
    async findByClientId(cId: string) {
      return Array.from(projectsDb.values()).filter((p) => p.clientId === cId);
    },
    async findByFreelancerId(fId: string) {
      return Array.from(projectsDb.values()).filter((p) => p.freelancerId === fId);
    },
    async create(p: Project) { projectsDb.set(p.id, p); },
    async update(p: Project) { projectsDb.set(p.id, p); },
  };

  const mockMilestoneRepo: IMilestoneRepository = {
    async findById(id: string) { return milestonesDb.get(id) ?? null; },
    async findByProjectId(pId: string) {
      return Array.from(milestonesDb.values()).filter((m) => m.projectId === pId);
    },
    async create(m: Milestone) { milestonesDb.set(m.id, m); },
    async update(m: Milestone) { milestonesDb.set(m.id, m); },
  };

  const mockLedgerRepo: ITransactionLedgerRepository = {
    async create(entry: TransactionLedger) { ledgersDb.push(entry); },
    async findByWalletId(walletId: string) {
      return ledgersDb.filter((e) => e.walletId === walletId);
    },
  };

  const mockAuditLogger: IAuditLogger = {
    async log() {},
  };

  const mockEscrowQueue: IEscrowQueue = {
    async scheduleAutoRelease() {},
    async cancelAutoRelease() {},
  };

  beforeAll(async () => {
    // Seed initial client wallet with 200,000 paise (₹2,000)
    const clientWallet = Wallet.create('wallet-client', clientId);
    clientWallet.credit(200000);
    walletsDb.set(clientWallet.id, clientWallet);

    // Seed freelancer wallet with 0 paise
    const freelancerWallet = Wallet.create('wallet-freelancer', freelancerId);
    walletsDb.set(freelancerWallet.id, freelancerWallet);

    const mockConfig: Env = {
      NODE_ENV: 'test',
      PORT: 3000,
      LOG_LEVEL: 'silent',
      SUPABASE_URL: 'http://mock-supabase.local',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-key',
      SUPABASE_ANON_KEY: 'mock-anon',
      RAZORPAY_KEY_ID: 'mock_rzp_key',
      RAZORPAY_KEY_SECRET: 'mock_rzp_secret',
    };

    app = await buildApp(mockConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      escrowRepository: mockEscrowRepo,
      projectRepository: mockProjectRepo,
      milestoneRepository: mockMilestoneRepo,
      auditLogger: mockAuditLogger,
      transactionLedgerRepository: mockLedgerRepo,
      escrowQueue: mockEscrowQueue,
    });
  });

  let createdProjectId: string;
  let createdMilestoneId: string;

  it('client can create a new project contract', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/freelance/projects',
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
        'idempotency-key': 'idem-proj-1',
      },
      payload: {
        freelancerId,
        title: 'Full Stack Web Platform',
        description: 'React + Node.js escrow system',
        totalBudget: 100000,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.title).toBe('Full Stack Web Platform');
    expect(body.data.status).toBe('ACTIVE');

    createdProjectId = body.data.id;
  });

  it('client can add a milestone to the project', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/projects/${createdProjectId}/milestones`,
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
        'idempotency-key': 'idem-ms-1',
      },
      payload: {
        title: 'Milestone 1: Clean Architecture Backend',
        description: 'Complete API and unit tests',
        amount: 80000,
        sowText: 'Deliver backend with 100% test coverage',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.amount).toBe(80000);
    expect(body.data.status).toBe('PENDING');

    createdMilestoneId = body.data.id;
  });

  it('client can fund the milestone into escrow', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/fund`,
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
        'idempotency-key': 'idem-fund-ms-1',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.milestone.status).toBe('FUNDED');
    expect(body.data.escrow.status).toBe('FUNDED_IN_ESCROW');
    expect(body.data.escrow.amount).toBe(80000);

    // Verify client wallet has locked 80000 into escrow
    const clientWallet = await mockWalletRepo.findByUserId(clientId);
    expect(clientWallet?.availableBalance).toBe(120000); // 200000 - 80000
    expect(clientWallet?.frozenBalance).toBe(80000);
  });

  it('freelancer submits deliverable URL -> triggers AI Quality Gate and UNDER_REVIEW', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/submit`,
      headers: {
        authorization: `Bearer mock-token-${freelancerId}`,
        'idempotency-key': 'idem-sub-ms-1',
      },
      payload: {
        submissionUrl: 'https://github.com/freelancer/trust-platform',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('UNDER_REVIEW');
    expect(body.data.qualityGateResult.passed).toBe(true);
    expect(body.data.qualityGateResult.score).toBeGreaterThan(80);
    expect(body.data.reviewDeadline).toBeDefined();

    // Verify underlying escrow transitioned to INSPECTION_PERIOD
    const milestone = milestonesDb.get(createdMilestoneId);
    const escrow = escrowsDb.get(milestone!.escrowTransactionId!);
    expect(escrow?.status).toBe('INSPECTION_PERIOD');
  });

  it('client requests changes on the milestone (revision 1)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/request-changes`,
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
        'idempotency-key': 'idem-chg-ms-1',
      },
      payload: {
        feedback: 'Please update documentation and fix lint warning',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('CHANGES_REQUESTED');
    expect(body.data.revisionCount).toBe(1);
  });

  it('freelancer resubmits revised deliverable', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/submit`,
      headers: {
        authorization: `Bearer mock-token-${freelancerId}`,
        'idempotency-key': 'idem-sub-ms-2',
      },
      payload: {
        submissionUrl: 'https://github.com/freelancer/trust-platform/tree/revision-1',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe('UNDER_REVIEW');
  });

  it('client approves milestone -> funds released to freelancer wallet minus 5% fee', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/approve`,
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
        'idempotency-key': 'idem-appr-ms-1',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('RELEASED');

    // 80,000 paise - 5% (4,000 paise) = 76,000 paise credited to freelancer
    const freelancerWallet = await mockWalletRepo.findByUserId(freelancerId);
    expect(freelancerWallet?.availableBalance).toBe(76000);

    // Client escrow balance reduced to 0
    const clientWallet = await mockWalletRepo.findByUserId(clientId);
    expect(clientWallet?.frozenBalance).toBe(0);

    // Project marked COMPLETED because all milestones are released
    const project = projectsDb.get(createdProjectId);
    expect(project?.status).toBe('COMPLETED');
  });

  it('enforces maximum 3 revision rounds strictly', async () => {
    // Create a new project for this revision limit test
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/v1/freelance/projects',
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
      },
      payload: {
        freelancerId,
        title: 'Project 2 Revision Limits Test',
        totalBudget: 50000,
      },
    });
    const proj2Id = JSON.parse(projRes.body).data.id;

    // Create a new milestone to test revision round limits
    const msRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/projects/${proj2Id}/milestones`,
      headers: {
        authorization: `Bearer mock-token-${clientId}`,
      },
      payload: {
        title: 'Milestone 2: Extra Feature',
        amount: 20000,
      },
    });
    const msId = JSON.parse(msRes.body).data.id;

    // Fund it
    await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/fund`,
      headers: { authorization: `Bearer mock-token-${clientId}` },
    });

    // Submit -> Revision 1
    await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/submit`,
      headers: { authorization: `Bearer mock-token-${freelancerId}` },
      payload: { submissionUrl: 'https://example.com/rev0' },
    });
    const r1 = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/request-changes`,
      headers: { authorization: `Bearer mock-token-${clientId}` },
      payload: { feedback: 'Round 1 feedback' },
    });
    expect(r1.statusCode).toBe(200);

    // Submit -> Revision 2
    await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/submit`,
      headers: { authorization: `Bearer mock-token-${freelancerId}` },
      payload: { submissionUrl: 'https://example.com/rev1' },
    });
    const r2 = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/request-changes`,
      headers: { authorization: `Bearer mock-token-${clientId}` },
      payload: { feedback: 'Round 2 feedback' },
    });
    expect(r2.statusCode).toBe(200);

    // Submit -> Revision 3
    await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/submit`,
      headers: { authorization: `Bearer mock-token-${freelancerId}` },
      payload: { submissionUrl: 'https://example.com/rev2' },
    });
    const r3 = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/request-changes`,
      headers: { authorization: `Bearer mock-token-${clientId}` },
      payload: { feedback: 'Round 3 feedback' },
    });
    expect(r3.statusCode).toBe(200);

    // Submit -> Revision 4 (MUST FAIL)
    await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/submit`,
      headers: { authorization: `Bearer mock-token-${freelancerId}` },
      payload: { submissionUrl: 'https://example.com/rev3' },
    });
    const r4 = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${msId}/request-changes`,
      headers: { authorization: `Bearer mock-token-${clientId}` },
      payload: { feedback: 'Round 4 feedback' },
    });
    expect(r4.statusCode).toBe(400);
    const r4Body = JSON.parse(r4.body);
    expect(r4Body.error.message).toContain('revision rounds exceeded');
  });

  it('rejects unauthorized access (non-client creating milestone, non-freelancer submitting)', async () => {
    const wrongUser = '99999999-9999-4999-8999-999999999999';

    const failMilestoneRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/projects/${createdProjectId}/milestones`,
      headers: {
        authorization: `Bearer mock-token-${wrongUser}`,
      },
      payload: {
        title: 'Unauthorized Milestone',
        amount: 10000,
      },
    });
    expect(failMilestoneRes.statusCode).toBe(403);

    const failSubmitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${createdMilestoneId}/submit`,
      headers: {
        authorization: `Bearer mock-token-${wrongUser}`,
      },
      payload: {
        submissionUrl: 'https://example.com/fake',
      },
    });
    expect(failSubmitRes.statusCode).toBe(403);
  });
});
