import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './shared/errors/index.js';
import { type Env } from './shared/config.js';
import { generateRequestId } from './shared/utils/index.js';
import { API_PREFIX } from './shared/constants/index.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IDigitalGoodsListingRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IPaymentGateway,
  IEscrowQueue,
  IProjectRepository,
  IMilestoneRepository,
  ICodeQualityGate,
  IGamingChallengeRepository,
  IMatchResultRepository,
  IMatchVerifier,
  INotificationRepository,
  IPushNotificationService,
  ICredentialVerifier,
  IGhostingPredictor,
} from './application/interfaces/index.js';
import {
  RegisterUser,
  GetUserProfile,
  UpdateProfile,
  UpdateKycStatus,
} from './application/use-cases/auth/index.js';
import {
  GetWalletBalance,
  CreateDepositOrder,
  VerifyAndCreditDeposit,
  WithdrawFunds,
  FreezeForEscrow,
  ReleaseFromEscrow,
  RefundFromEscrow,
  GetTransactionHistory,
} from './application/use-cases/wallet/index.js';
import {
  CreateEscrow,
  FundEscrow,
  TransitionEscrowState,
  DisputeEscrow,
  GetEscrowDetails,
} from './application/use-cases/escrow/index.js';
import {
  CreateListing,
  GetListings,
  GetListingById,
  BuyListing,
  SubmitDelivery,
  ApproveDelivery,
} from './application/use-cases/digital-goods/index.js';
import {
  CreateProject,
  GetProjectById,
  CreateMilestone,
  FundMilestone,
  SubmitMilestoneDeliverable,
  RequestMilestoneChanges,
  ApproveMilestone,
} from './application/use-cases/freelance/index.js';
import {
  CreateChallenge,
  AcceptChallenge,
  GetChallengeById,
  GetOpenChallenges,
  ReportMatchResult,
  ClaimTimeoutWin,
  ResolveGamingDispute,
  CancelChallenge,
} from './application/use-cases/gaming/index.js';
import {
  GetTrustScoreDetails,
  AdjustTrustScore,
  ApplyInactivityDecay,
} from './application/use-cases/trust-score/index.js';
import {
  SendNotification,
  GetUserNotifications,
  MarkNotificationRead,
  MarkAllNotificationsRead,
} from './application/use-cases/notification/index.js';
import {
  VerifyDigitalCredentials,
  AssessGhostingRisk,
} from './application/use-cases/ai/index.js';
import {
  createSupabaseAdmin,
  SupabaseUserRepository,
  SupabaseWalletRepository,
  SupabaseAuditLogger,
  SupabaseTransactionLedgerRepository,
  SupabaseEscrowRepository,
  SupabaseDigitalGoodsListingRepository,
  SupabaseProjectRepository,
  SupabaseMilestoneRepository,
  SupabaseGamingChallengeRepository,
  SupabaseMatchResultRepository,
  SupabaseNotificationRepository,
} from './infrastructure/database/index.js';
import { FirebaseFcmStub, FirebaseAdminPushService } from './infrastructure/notification/index.js';
import { FirebaseStorageService } from './infrastructure/storage/FirebaseStorageService.js';
import { FirebaseAuthService } from './infrastructure/auth/FirebaseAuthService.js';
import { initFirebaseAdmin } from './infrastructure/firebase/firebaseAdmin.js';
import type { IStorageService, IFirebaseAuthService } from './application/interfaces/index.js';
import { RazorpayAdapter } from './infrastructure/payment/index.js';
import {
  CodeQualityGateStub,
  MatchVerifierStub,
  CredentialVerifierStub,
  GhostingPredictorStub,
} from './infrastructure/ai/index.js';
import { EscrowQueueService } from './infrastructure/queue/index.js';
import { createAutoReleaseWorker } from './infrastructure/queue/workers/AutoReleaseWorker.js';
import { createAuthMiddleware } from './presentation/middleware/index.js';
import {
  authRoutes,
  userRoutes,
  walletRoutes,
  escrowRoutes,
  digitalGoodsRoutes,
  freelanceRoutes,
  gamingRoutes,
  trustScoreRoutes,
  notificationRoutes,
  aiRoutes,
  storageRoutes,
} from './presentation/routes/index.js';

/**
 * Injected dependencies for application bootstrap.
 * Allows supplying mocks for isolated unit and integration testing.
 */
export interface AppDependencies {
  supabaseAdmin?: SupabaseClient;
  userRepository?: IUserRepository;
  walletRepository?: IWalletRepository;
  escrowRepository?: IEscrowRepository;
  digitalGoodsListingRepository?: IDigitalGoodsListingRepository;
  projectRepository?: IProjectRepository;
  milestoneRepository?: IMilestoneRepository;
  codeQualityGate?: ICodeQualityGate;
  gamingChallengeRepository?: IGamingChallengeRepository;
  matchResultRepository?: IMatchResultRepository;
  matchVerifier?: IMatchVerifier;
  auditLogger?: IAuditLogger;
  transactionLedgerRepository?: ITransactionLedgerRepository;
  paymentGateway?: IPaymentGateway;
  escrowQueue?: IEscrowQueue;
  notificationRepository?: INotificationRepository;
  pushNotificationService?: IPushNotificationService;
  credentialVerifier?: ICredentialVerifier;
  ghostingPredictor?: IGhostingPredictor;
  storageService?: IStorageService;
  firebaseAuthService?: IFirebaseAuthService;
}

/**
 * Builds and configures the Fastify application instance.
 * Registers all plugins, middleware, error handlers, and routes.
 *
 * @param config - Validated environment configuration
 * @param dependencies - Optional dependency overrides for testing
 * @returns Configured Fastify instance (not yet listening)
 */
export async function buildApp(
  config: Env,
  dependencies?: AppDependencies,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    genReqId: () => generateRequestId(),
    requestIdHeader: 'x-request-id',
  });

  // ── Security Plugins ──────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: config.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Global Error Handler ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fastify error handler types are loosely typed
  app.setErrorHandler((error: any, request, reply) => {
    // Operational domain/application errors
    if (error instanceof AppError && error.isOperational) {
      request.log.warn({ err: error, requestId: request.id }, error.message);
      return reply.status(error.statusCode).send({
        error: error.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      request.log.warn({ err: error, requestId: request.id }, 'Zod validation error');
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.issues[0]?.message ?? 'Validation failed',
          details: error.issues,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }

    // Fastify schema validation errors
    if (error.validation) {
      request.log.warn({ err: error, requestId: request.id }, 'Validation error');
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: String(error.message ?? 'Validation failed'),
          details: error.validation,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }

    // Unexpected internal errors
    request.log.error({ err: error, requestId: request.id }, 'Unhandled error');
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });

  // ── Health Check ──────────────────────────────────────────────
  app.get(`${API_PREFIX}/health`, async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
    });
  });

  // ── Infrastructure & Dependency Injection ─────────────────────
  const supabaseAdmin =
    dependencies?.supabaseAdmin ??
    createSupabaseAdmin(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  const userRepo =
    dependencies?.userRepository ?? new SupabaseUserRepository(supabaseAdmin);
  const walletRepo =
    dependencies?.walletRepository ?? new SupabaseWalletRepository(supabaseAdmin);
  const escrowRepo =
    dependencies?.escrowRepository ?? new SupabaseEscrowRepository(supabaseAdmin);
  const listingRepo =
    dependencies?.digitalGoodsListingRepository ??
    new SupabaseDigitalGoodsListingRepository(supabaseAdmin);
  const projectRepo =
    dependencies?.projectRepository ??
    new SupabaseProjectRepository(supabaseAdmin);
  const milestoneRepo =
    dependencies?.milestoneRepository ??
    new SupabaseMilestoneRepository(supabaseAdmin);
  const challengeRepo =
    dependencies?.gamingChallengeRepository ??
    new SupabaseGamingChallengeRepository(supabaseAdmin);
  const matchResultRepo =
    dependencies?.matchResultRepository ??
    new SupabaseMatchResultRepository(supabaseAdmin);
  const matchVerifier =
    dependencies?.matchVerifier ?? new MatchVerifierStub();
  const codeQualityGate =
    dependencies?.codeQualityGate ?? new CodeQualityGateStub();
  const credentialVerifier =
    dependencies?.credentialVerifier ?? new CredentialVerifierStub();
  const ghostingPredictor =
    dependencies?.ghostingPredictor ?? new GhostingPredictorStub();
  const auditLogger =
    dependencies?.auditLogger ?? new SupabaseAuditLogger(supabaseAdmin);
  const ledgerRepo =
    dependencies?.transactionLedgerRepository ??
    new SupabaseTransactionLedgerRepository(supabaseAdmin);
  const paymentGateway =
    dependencies?.paymentGateway ??
    new RazorpayAdapter(
      config.RAZORPAY_KEY_ID ?? 'mock_rzp_key',
      config.RAZORPAY_KEY_SECRET ?? 'mock_rzp_secret',
      config.NODE_ENV !== 'production',
    );
  const escrowQueue =
    dependencies?.escrowQueue ?? new EscrowQueueService();
  const notificationRepo =
    dependencies?.notificationRepository ??
    new SupabaseNotificationRepository(supabaseAdmin);
  // ── Firebase Infrastructure ──────────────────────────────────
  initFirebaseAdmin(config);

  const pushService =
    dependencies?.pushNotificationService ?? new FirebaseAdminPushService();
  const storageService =
    dependencies?.storageService ??
    new FirebaseStorageService(config.FIREBASE_STORAGE_BUCKET);
  const firebaseAuthService =
    dependencies?.firebaseAuthService ?? new FirebaseAuthService();

  // ── Application Use Cases ─────────────────────────────────────
  const registerUser = new RegisterUser(userRepo, walletRepo, auditLogger);
  const getUserProfile = new GetUserProfile(userRepo);
  const updateProfile = new UpdateProfile(userRepo);
  const updateKycStatus = new UpdateKycStatus(userRepo, auditLogger);

  const getWalletBalance = new GetWalletBalance(walletRepo);
  const createDepositOrder = new CreateDepositOrder(walletRepo, paymentGateway);
  const verifyAndCreditDeposit = new VerifyAndCreditDeposit(
    walletRepo,
    ledgerRepo,
    auditLogger,
    paymentGateway,
  );
  const withdrawFunds = new WithdrawFunds(walletRepo, ledgerRepo, auditLogger);
  const freezeForEscrow = new FreezeForEscrow(walletRepo, ledgerRepo, auditLogger);
  const releaseFromEscrow = new ReleaseFromEscrow(walletRepo, ledgerRepo, auditLogger);
  const refundFromEscrow = new RefundFromEscrow(walletRepo, ledgerRepo, auditLogger);
  const getTransactionHistory = new GetTransactionHistory(walletRepo, ledgerRepo);

  const createEscrow = new CreateEscrow(escrowRepo, auditLogger, userRepo);
  const fundEscrow = new FundEscrow(escrowRepo, freezeForEscrow, auditLogger);
  const transitionEscrowState = new TransitionEscrowState(
    escrowRepo,
    escrowQueue,
    releaseFromEscrow,
    refundFromEscrow,
    auditLogger,
  );
  const disputeEscrow = new DisputeEscrow(
    escrowRepo,
    escrowQueue,
    freezeForEscrow,
    auditLogger,
  );
  const getEscrowDetails = new GetEscrowDetails(escrowRepo);

  const createListing = new CreateListing(listingRepo, auditLogger);
  const getListings = new GetListings(listingRepo);
  const getListingById = new GetListingById(listingRepo);
  const buyListing = new BuyListing(
    listingRepo,
    createEscrow,
    fundEscrow,
    auditLogger,
  );
  const submitDelivery = new SubmitDelivery(
    listingRepo,
    transitionEscrowState,
    auditLogger,
  );
  const approveDelivery = new ApproveDelivery(listingRepo, transitionEscrowState);

  const createProject = new CreateProject(projectRepo, auditLogger);
  const getProjectById = new GetProjectById(projectRepo, milestoneRepo);
  const createMilestone = new CreateMilestone(projectRepo, milestoneRepo, auditLogger);
  const fundMilestone = new FundMilestone(
    projectRepo,
    milestoneRepo,
    createEscrow,
    fundEscrow,
    auditLogger,
  );
  const submitMilestoneDeliverable = new SubmitMilestoneDeliverable(
    projectRepo,
    milestoneRepo,
    escrowRepo,
    codeQualityGate,
    transitionEscrowState,
    auditLogger,
  );
  const requestMilestoneChanges = new RequestMilestoneChanges(
    projectRepo,
    milestoneRepo,
    auditLogger,
  );
  const approveMilestone = new ApproveMilestone(
    projectRepo,
    milestoneRepo,
    transitionEscrowState,
    auditLogger,
  );

  const createChallenge = new CreateChallenge(
    challengeRepo,
    freezeForEscrow,
    auditLogger,
  );
  const acceptChallenge = new AcceptChallenge(
    challengeRepo,
    escrowRepo,
    freezeForEscrow,
    createEscrow,
    auditLogger,
  );
  const getChallengeById = new GetChallengeById(
    challengeRepo,
    matchResultRepo,
  );
  const getOpenChallenges = new GetOpenChallenges(challengeRepo);
  const reportMatchResult = new ReportMatchResult(
    challengeRepo,
    matchResultRepo,
    walletRepo,
    ledgerRepo,
    escrowRepo,
    auditLogger,
  );
  const claimTimeoutWin = new ClaimTimeoutWin(
    challengeRepo,
    matchResultRepo,
    walletRepo,
    ledgerRepo,
    escrowRepo,
    auditLogger,
  );
  const resolveGamingDispute = new ResolveGamingDispute(
    challengeRepo,
    matchResultRepo,
    matchVerifier,
    walletRepo,
    ledgerRepo,
    escrowRepo,
    auditLogger,
  );
  const cancelChallenge = new CancelChallenge(
    challengeRepo,
    walletRepo,
    escrowRepo,
    auditLogger,
  );

  const getTrustScoreDetails = new GetTrustScoreDetails(userRepo);
  const adjustTrustScore = new AdjustTrustScore(userRepo, auditLogger);
  const applyInactivityDecay = new ApplyInactivityDecay(userRepo, adjustTrustScore);

  const sendNotification = new SendNotification(notificationRepo, pushService);
  const getUserNotifications = new GetUserNotifications(notificationRepo);
  const markNotificationRead = new MarkNotificationRead(notificationRepo);
  const markAllNotificationsRead = new MarkAllNotificationsRead(notificationRepo);

  const verifyDigitalCredentials = new VerifyDigitalCredentials(
    credentialVerifier,
    auditLogger,
    listingRepo,
  );
  const assessGhostingRisk = new AssessGhostingRisk(
    ghostingPredictor,
    auditLogger,
    userRepo,
    sendNotification,
  );

  // Wire auto-release worker
  if (escrowQueue instanceof EscrowQueueService) {
    const autoReleaseWorker = createAutoReleaseWorker(
      escrowRepo,
      transitionEscrowState,
    );
    escrowQueue.setHandler(autoReleaseWorker);
  }

  // ── Middleware ────────────────────────────────────────────────
  const authenticate = createAuthMiddleware(supabaseAdmin, firebaseAuthService);

  // ── Routes Registration ───────────────────────────────────────
  await app.register(authRoutes, {
    prefix: `${API_PREFIX}/auth`,
    registerUser,
    getUserProfile,
    authenticate,
  });

  await app.register(userRoutes, {
    prefix: `${API_PREFIX}/users`,
    getUserProfile,
    updateProfile,
    updateKycStatus,
    authenticate,
  });

  await app.register(walletRoutes, {
    prefix: `${API_PREFIX}/wallet`,
    getWalletBalance,
    createDepositOrder,
    verifyAndCreditDeposit,
    withdrawFunds,
    getTransactionHistory,
    authenticate,
  });

  await app.register(escrowRoutes, {
    prefix: `${API_PREFIX}/escrow`,
    createEscrow,
    fundEscrow,
    transitionEscrowState,
    disputeEscrow,
    getEscrowDetails,
    authenticate,
  });

  await app.register(digitalGoodsRoutes, {
    prefix: `${API_PREFIX}/digital-goods`,
    createListing,
    getListings,
    getListingById,
    buyListing,
    submitDelivery,
    approveDelivery,
    authenticate,
  });

  await app.register(freelanceRoutes, {
    prefix: `${API_PREFIX}/freelance`,
    createProject,
    getProjectById,
    createMilestone,
    fundMilestone,
    submitMilestoneDeliverable,
    requestMilestoneChanges,
    approveMilestone,
    authenticate,
  });

  await app.register(gamingRoutes, {
    prefix: `${API_PREFIX}/gaming`,
    createChallenge,
    acceptChallenge,
    getChallengeById,
    getOpenChallenges,
    reportMatchResult,
    claimTimeoutWin,
    resolveGamingDispute,
    cancelChallenge,
    authenticate,
  });

  await app.register(trustScoreRoutes, {
    prefix: `${API_PREFIX}/trust-score`,
    getTrustScoreDetails,
    adjustTrustScore,
    applyInactivityDecay,
    authenticate,
  });

  await app.register(notificationRoutes, {
    prefix: `${API_PREFIX}/notifications`,
    sendNotification,
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    authenticate,
  });

  await app.register(aiRoutes, {
    prefix: `${API_PREFIX}/ai`,
    verifyDigitalCredentials,
    assessGhostingRisk,
    authenticate,
  });

  await app.register(storageRoutes, {
    prefix: `${API_PREFIX}/storage`,
    storageService,
    authenticate,
  });

  // ── 404 Handler ───────────────────────────────────────────────
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
}
