import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import { DigitalGoodsListing } from '../../src/domain/entities/DigitalGoodsListing.js';
import { Project } from '../../src/domain/entities/Project.js';
import { Milestone } from '../../src/domain/entities/Milestone.js';
import { GamingChallenge } from '../../src/domain/entities/GamingChallenge.js';
import { MatchResult } from '../../src/domain/entities/MatchResult.js';
import { Notification } from '../../src/domain/entities/Notification.js';
import { EscrowQueueService } from '../../src/infrastructure/queue/EscrowQueueService.js';
import { CodeQualityGateStub } from '../../src/infrastructure/ai/CodeQualityGateStub.js';
import { MatchVerifierStub } from '../../src/infrastructure/ai/MatchVerifierStub.js';
import { CredentialVerifierStub } from '../../src/infrastructure/ai/CredentialVerifierStub.js';
import { GhostingPredictorStub } from '../../src/infrastructure/ai/GhostingPredictorStub.js';
import { FirebaseFcmStub } from '../../src/infrastructure/notification/FirebaseFcmStub.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IDigitalGoodsListingRepository,
  IProjectRepository,
  IMilestoneRepository,
  IGamingChallengeRepository,
  IMatchResultRepository,
  INotificationRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IPaymentGateway,
  AuditEvent,
  NotificationQueryOptions,
} from '../../src/application/interfaces/index.js';

describe('Full Platform Pipeline & AI Verification Audit', () => {
  let app: FastifyInstance;

  // In-memory persistence maps
  const usersDb = new Map<string, User>();
  const walletsDb = new Map<string, Wallet>();
  const escrowsDb = new Map<string, EscrowTransaction>();
  const listingsDb = new Map<string, DigitalGoodsListing>();
  const projectsDb = new Map<string, Project>();
  const milestonesDb = new Map<string, Milestone>();
  const challengesDb = new Map<string, GamingChallenge>();
  const matchResultsDb = new Map<string, MatchResult>();
  const notificationsDb = new Map<string, Notification>();
  const ledgersDb: TransactionLedger[] = [];
  const auditLogs: AuditEvent[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) { return usersDb.get(id) ?? null; },
    async findByEmail(email: string) {
      for (const u of usersDb.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    async findByPhone() { return null; },
    async create(user: User) { usersDb.set(user.id, user); },
    async update(user: User) { usersDb.set(user.id, user); },
  };

  const mockWalletRepo: IWalletRepository = {
    async findById(id: string) { return walletsDb.get(id) ?? null; },
    async findByUserId(userId: string) {
      for (const w of walletsDb.values()) {
        if (w.userId === userId) return w;
      }
      return null;
    },
    async create(wallet: Wallet) { walletsDb.set(wallet.id, wallet); },
    async save(wallet: Wallet) { walletsDb.set(wallet.id, wallet); },
  };

  const mockEscrowRepo: IEscrowRepository = {
    async findById(id: string) { return escrowsDb.get(id) ?? null; },
    async findByBuyerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.buyerId === id);
    },
    async findBySellerId(id: string) {
      return Array.from(escrowsDb.values()).filter((e) => e.sellerId === id);
    },
    async create(escrow: EscrowTransaction) { escrowsDb.set(escrow.id, escrow); },
    async save(escrow: EscrowTransaction) { escrowsDb.set(escrow.id, escrow); },
  };

  const mockListingRepo: IDigitalGoodsListingRepository = {
    async findById(id: string) { return listingsDb.get(id) ?? null; },
    async findAll() { return Array.from(listingsDb.values()); },
    async create(l: DigitalGoodsListing) { listingsDb.set(l.id, l); },
    async update(l: DigitalGoodsListing) { listingsDb.set(l.id, l); },
  };

  const mockProjectRepo: IProjectRepository = {
    async findById(id: string) { return projectsDb.get(id) ?? null; },
    async findByClientId(id: string) {
      return Array.from(projectsDb.values()).filter((p) => p.clientId === id);
    },
    async findByFreelancerId(id: string) {
      return Array.from(projectsDb.values()).filter((p) => p.freelancerId === id);
    },
    async create(p: Project) { projectsDb.set(p.id, p); },
    async save(p: Project) { projectsDb.set(p.id, p); },
    async update(p: Project) { projectsDb.set(p.id, p); },
  };

  const mockMilestoneRepo: IMilestoneRepository = {
    async findById(id: string) { return milestonesDb.get(id) ?? null; },
    async findByProjectId(id: string) {
      return Array.from(milestonesDb.values()).filter((m) => m.projectId === id);
    },
    async create(m: Milestone) { milestonesDb.set(m.id, m); },
    async save(m: Milestone) { milestonesDb.set(m.id, m); },
    async update(m: Milestone) { milestonesDb.set(m.id, m); },
  };

  const mockChallengeRepo: IGamingChallengeRepository = {
    async findById(id: string) { return challengesDb.get(id) ?? null; },
    async findAll() { return Array.from(challengesDb.values()); },
    async findOpenChallenges() { return Array.from(challengesDb.values()); },
    async findByUserId(uid: string) {
      return Array.from(challengesDb.values()).filter(c => c.creatorId === uid || c.opponentId === uid);
    },
    async create(c: GamingChallenge) { challengesDb.set(c.id, c); },
    async save(c: GamingChallenge) { challengesDb.set(c.id, c); },
    async update(c: GamingChallenge) { challengesDb.set(c.id, c); },
  };

  const mockMatchResultRepo: IMatchResultRepository = {
    async findById(id: string) { return matchResultsDb.get(id) ?? null; },
    async findByChallengeId(id: string) {
      return Array.from(matchResultsDb.values()).filter((m) => m.challengeId === id);
    },
    async create(m: MatchResult) { matchResultsDb.set(m.id, m); },
    async save(m: MatchResult) { matchResultsDb.set(m.id, m); },
    async update(m: MatchResult) { matchResultsDb.set(m.id, m); },
  };

  const mockNotificationRepo: INotificationRepository = {
    async create(n: Notification) { notificationsDb.set(n.id, n); },
    async findById(id: string) { return notificationsDb.get(id) ?? null; },
    async findByUserId(uid: string, opt?: NotificationQueryOptions) {
      let l = Array.from(notificationsDb.values()).filter((n) => n.userId === uid);
      if (opt?.unreadOnly) l = l.filter((n) => !n.isRead);
      return l;
    },
    async markAsRead(id: string, uid: string) {
      const n = notificationsDb.get(id);
      if (!n || n.userId !== uid) return null;
      n.markAsRead();
      return n;
    },
    async markAllAsRead(uid: string) {
      let c = 0;
      for (const n of notificationsDb.values()) {
        if (n.userId === uid && !n.isRead) { n.markAsRead(); c++; }
      }
      return c;
    },
    async getUnreadCount(uid: string) {
      return Array.from(notificationsDb.values()).filter((n) => n.userId === uid && !n.isRead).length;
    },
  };

  const mockLedgerRepo: ITransactionLedgerRepository = {
    async create(e: TransactionLedger) { ledgersDb.push(e); },
    async findByWalletId(wid: string) { return ledgersDb.filter((l) => l.walletId === wid); },
  };

  const mockAuditLogger: IAuditLogger = {
    async log(event: AuditEvent) { auditLogs.push(event); },
  };

  const mockPaymentGateway: IPaymentGateway = {
    async createOrder(p) { return { orderId: 'ord_audit_1', amount: p.amount, currency: 'INR' }; },
    verifyPaymentSignature() { return true; },
    async processRefund() { return { refundId: 'rfnd_audit_1', status: 'processed' }; },
  };

  const testConfig: Env = {
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    REDIS_URL: 'redis://localhost:6379',
    RAZORPAY_KEY_ID: 'mock_rzp_id',
    RAZORPAY_KEY_SECRET: 'mock_rzp_secret',
  };

  // Test Actors
  const buyerId = '11111111-1111-4111-8111-111111111111';
  const sellerId = '22222222-2222-4222-8222-222222222222';
  const gamerId = '33333333-3333-4333-8333-333333333333';

  beforeAll(async () => {
    app = await buildApp(testConfig, {
      userRepository: mockUserRepo,
      walletRepository: mockWalletRepo,
      escrowRepository: mockEscrowRepo,
      digitalGoodsListingRepository: mockListingRepo,
      projectRepository: mockProjectRepo,
      milestoneRepository: mockMilestoneRepo,
      gamingChallengeRepository: mockChallengeRepo,
      matchResultRepository: mockMatchResultRepo,
      notificationRepository: mockNotificationRepo,
      transactionLedgerRepository: mockLedgerRepo,
      paymentGateway: mockPaymentGateway,
      auditLogger: mockAuditLogger,
      escrowQueue: new EscrowQueueService(),
      codeQualityGate: new CodeQualityGateStub(),
      matchVerifier: new MatchVerifierStub(),
      credentialVerifier: new CredentialVerifierStub(),
      ghostingPredictor: new GhostingPredictorStub(),
      pushNotificationService: new FirebaseFcmStub(),
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Pipeline Step 1: Registers users and completes KYC verification with trust score upgrade', async () => {
    // 1. Register Buyer
    const regBuyer = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        id: buyerId,
        email: 'buyer.audit@trustvault.io',
        displayName: 'Alice Buyer',
        authProvider: 'email',
      },
    });
    expect(regBuyer.statusCode).toBe(201);

    // 2. Register Seller
    const regSeller = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        id: sellerId,
        email: 'seller.audit@trustvault.io',
        displayName: 'Bob Seller',
        authProvider: 'email',
      },
    });
    expect(regSeller.statusCode).toBe(201);

    // 3. Complete KYC for Seller (UNVERIFIED -> PENDING -> VERIFIED)
    await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${sellerId}/kyc-status`,
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_kyc_pending',
      },
      payload: {
        targetStatus: 'PENDING',
        reason: 'National ID uploaded for verification',
      },
    });

    const kycRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${sellerId}/kyc-status`,
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_kyc_1',
      },
      payload: {
        targetStatus: 'VERIFIED',
        reason: 'National ID document verified authentic',
      },
    });
    expect(kycRes.statusCode).toBe(200);

    const sellerProfile = await app.inject({
      method: 'GET',
      url: `/api/v1/trust-score/${sellerId}`,
    });
    const sellerTier = JSON.parse(sellerProfile.body);
    expect(sellerTier.data.score).toBe(65); // 50 + 15 KYC bonus
    expect(sellerTier.data.tier).toBe('SILVER');
  });

  it('Pipeline Step 2: Deposits funds into Buyer wallet and verifies ledger entries', async () => {
    // 1. Create deposit order for ₹50,000 (5,000,000 paise)
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/deposit/order',
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_dep_ord',
      },
      payload: { amount: 5000000 },
    });
    expect(orderRes.statusCode).toBe(201);

    // 2. Verify payment and credit wallet
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/deposit/verify',
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_dep_ver',
      },
      payload: {
        orderId: 'ord_audit_1',
        paymentId: 'pay_audit_1',
        signature: 'valid_sig_mock',
        amount: 5000000,
      },
    });
    expect(verifyRes.statusCode).toBe(200);

    // 3. Verify balance
    const balRes = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet/balance',
      headers: { authorization: `Bearer mock-token-${buyerId}` },
    });
    const balJson = JSON.parse(balRes.body);
    expect(balJson.data.availableBalance).toBe(5000000);
  });

  it('Pipeline Step 3: Digital Goods Lifecycle (AI verification -> Buy -> Deliver -> Approve -> Settlement)', async () => {
    // 1. Seller creates listing
    const listingRes = await app.inject({
      method: 'POST',
      url: '/api/v1/digital-goods/listings',
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_listing_1',
      },
      payload: {
        title: 'Premium Developer API Key Bundle',
        description: 'Verified GPT-4 and Claude Pro access',
        price: 200000, // ₹2,000
        category: 'API_KEY',
      },
    });
    expect(listingRes.statusCode).toBe(201);
    const listingId = JSON.parse(listingRes.body).data.id;

    // 2. Run AI credential verification on listing
    const aiVerifyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/verify-credentials',
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_ai_cred',
      },
      payload: {
        listingId,
        category: 'API_KEY',
        payload: 'sk_live_authentic_pro_key_55555',
      },
    });
    expect(aiVerifyRes.statusCode).toBe(200);
    expect(JSON.parse(aiVerifyRes.body).data.isValid).toBe(true);

    // 3. Buyer buys listing (escrow initiated and funded)
    const buyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/digital-goods/listings/${listingId}/buy`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_buy_1',
      },
    });
    expect(buyRes.statusCode).toBe(200);
    const buyData = JSON.parse(buyRes.body).data;
    const escrowId = buyData.escrow.id;
    expect(escrowId).toBeDefined();

    // 4. Seller submits delivery credentials
    const delivRes = await app.inject({
      method: 'POST',
      url: `/api/v1/digital-goods/listings/${listingId}/deliver`,
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_deliv_1',
      },
      payload: {
        credentialsOrPayload:
          'key: sk_live_authentic_pro_key_55555, portal: https://api.provider.com/dashboard',
        instructions: 'Test delivery instructions',
      },
    });
    expect(delivRes.statusCode).toBe(200);

    // 5. Buyer approves delivery (settles funds)
    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/digital-goods/listings/${listingId}/approve`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_appr_1',
      },
    });
    expect(approveRes.statusCode).toBe(200);

    // 6. Verify seller received funds minus 5% platform fee (200000 * 0.95 = 190000)
    const sellerBal = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet/balance',
      headers: { authorization: `Bearer mock-token-${sellerId}` },
    });
    expect(JSON.parse(sellerBal.body).data.availableBalance).toBe(190000);
  });

  it('Pipeline Step 4: Freelance Project & Milestone with AI Code Quality Gate', async () => {
    // 1. Client (buyerId) creates project with freelancer (sellerId)
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/v1/freelance/projects',
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_proj_1',
      },
      payload: {
        freelancerId: sellerId,
        title: 'Next.js E-Commerce Frontend',
        description: 'Complete storefront with Stripe and Supabase',
        totalBudget: 400000, // ₹4,000
      },
    });
    expect(projRes.statusCode).toBe(201);
    const projectId = JSON.parse(projRes.body).data.id;

    // 2. Create milestone
    const msRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/projects/${projectId}/milestones`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_ms_1',
      },
      payload: {
        title: 'Milestone 1: Auth & Cart Architecture',
        amount: 200000,
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      },
    });
    expect(msRes.statusCode).toBe(201);
    const milestoneId = JSON.parse(msRes.body).data.id;

    // 3. Fund milestone
    const fundRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${milestoneId}/fund`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_fund_ms_1',
      },
    });
    expect(fundRes.statusCode).toBe(200);

    // 4. Freelancer submits deliverable URL (runs AI quality gate automatically)
    const subRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${milestoneId}/submit`,
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_sub_ms_1',
      },
      payload: {
        submissionUrl: 'https://github.com/freelancer/ecommerce-frontend-repo',
        submissionNotes: 'All unit tests passing with 89% coverage',
      },
    });
    expect(subRes.statusCode).toBe(200);
    const subData = JSON.parse(subRes.body).data;
    expect(subData.qualityGateResult.passed).toBe(true);
    expect(subData.qualityGateResult.score).toBe(94);

    // 5. Client approves milestone
    const apprMsRes = await app.inject({
      method: 'POST',
      url: `/api/v1/freelance/milestones/${milestoneId}/approve`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_appr_ms_1',
      },
    });
    expect(apprMsRes.statusCode).toBe(200);
  });

  it('Pipeline Step 5: Gaming Wager Escrow & Consensus Resolution', async () => {
    // Register Gamer 2
    const regGamer = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        id: gamerId,
        email: 'gamer2.audit@trustvault.io',
        displayName: 'Charlie Gamer',
        authProvider: 'email',
      },
    });
    expect(regGamer.statusCode).toBe(201);

    // Give Gamer 2 funds
    const w2 = walletsDb.get(Array.from(walletsDb.keys()).find(k => walletsDb.get(k)!.userId === gamerId)!)!;
    w2.credit(100000); // ₹1,000

    // 1. Buyer creates challenge for ₹500 (50,000 paise)
    const challRes = await app.inject({
      method: 'POST',
      url: '/api/v1/gaming/challenges',
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_chall_1',
      },
      payload: {
        gameTitle: 'FIFA 24',
        stakeAmount: 50000,
        rules: { mode: '1v1', halves: '6m' },
      },
    });
    expect(challRes.statusCode).toBe(201);
    const challengeId = JSON.parse(challRes.body).data.id;

    // 2. Gamer 2 accepts challenge (locks dual stakes into escrow)
    const accRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/accept`,
      headers: {
        authorization: `Bearer mock-token-${gamerId}`,
        'idempotency-key': 'idem_audit_acc_chall_1',
      },
    });
    expect(accRes.statusCode).toBe(200);

    // 3. Both report Buyer as winner (consensus settlement)
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_rep_1',
      },
      payload: { claimedWinnerId: buyerId },
    });

    const repRes2 = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: {
        authorization: `Bearer mock-token-${gamerId}`,
        'idempotency-key': 'idem_audit_rep_2',
      },
      payload: { claimedWinnerId: buyerId },
    });
    expect(repRes2.statusCode).toBe(200);
    const repJson2 = JSON.parse(repRes2.body).data;
    expect(repJson2.settlementScenario).toBe('DUAL_CONSENSUS');
    expect(repJson2.challenge.status).toBe('COMPLETED');
  });

  it('Pipeline Step 6: AI Ghosting Assessment & Inactivity Notification', async () => {
    const ghostRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/assess-ghosting',
      headers: {
        authorization: `Bearer mock-token-${buyerId}`,
        'idempotency-key': 'idem_audit_ghost_eval',
      },
      payload: {
        userId: sellerId,
        lastActivityAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
        pendingMilestoneCount: 1,
        daysUntilDeadline: 1,
      },
    });
    expect(ghostRes.statusCode).toBe(200);
    const ghostJson = JSON.parse(ghostRes.body);
    expect(ghostJson.data.riskScore).toBeGreaterThan(40);
    expect(['HIGH', 'CRITICAL']).toContain(ghostJson.data.riskLevel);
  });

  it('Pipeline Step 7: Notification System and Audit Log Integrity', async () => {
    // Send notification to seller
    const sendNotif = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/send',
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_notif_1',
      },
      payload: {
        userId: sellerId,
        type: 'ESCROW_RELEASED',
        title: 'Milestone Funds Available',
        body: '₹1,900 has been credited to your available balance.',
      },
    });
    expect(sendNotif.statusCode).toBe(201);

    // List notifications
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: { authorization: `Bearer mock-token-${sellerId}` },
    });
    expect(listRes.statusCode).toBe(200);
    const notifs = JSON.parse(listRes.body).data;
    expect(notifs.unreadCount).toBeGreaterThan(0);

    // Mark all as read
    const readAllRes = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/read-all',
      headers: {
        authorization: `Bearer mock-token-${sellerId}`,
        'idempotency-key': 'idem_audit_readall_1',
      },
    });
    expect(readAllRes.statusCode).toBe(200);

    // Verify audit log has tamper-evident records from all operations
    expect(auditLogs.length).toBeGreaterThan(10);
    const actions = auditLogs.map((a) => a.action);
    expect(actions).toContain('USER_REGISTERED');
    expect(actions.some((a) => a.startsWith('KYC_TRANSITION'))).toBe(true);
    expect(actions).toContain('DEPOSIT_PROCESSED');
    expect(actions).toContain('CREDENTIALS_VERIFIED');
    expect(actions).toContain('ESCROW_FUNDS_FROZEN');
    expect(actions).toContain('ESCROW_FUNDS_RELEASED');
  });
});
