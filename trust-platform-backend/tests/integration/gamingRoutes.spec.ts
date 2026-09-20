import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { Env } from '../../src/shared/config.js';
import { User } from '../../src/domain/entities/User.js';
import { Wallet } from '../../src/domain/entities/Wallet.js';
import { GamingChallenge } from '../../src/domain/entities/GamingChallenge.js';
import { MatchResult } from '../../src/domain/entities/MatchResult.js';
import { EscrowTransaction } from '../../src/domain/entities/EscrowTransaction.js';
import { TransactionLedger } from '../../src/domain/entities/TransactionLedger.js';
import type {
  IUserRepository,
  IWalletRepository,
  IEscrowRepository,
  IGamingChallengeRepository,
  IMatchResultRepository,
  IAuditLogger,
  ITransactionLedgerRepository,
  IEscrowQueue,
} from '../../src/application/interfaces/index.js';

describe('Gaming Wager Escrow Routes Integration (All 6 Settlement Scenarios)', () => {
  let app: FastifyInstance;

  const playerAId = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  const playerBId = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
  const adminId = '99999999-9999-4999-8999-999999999999';

  const challengesDb = new Map<string, GamingChallenge>();
  const matchResultsDb = new Map<string, MatchResult>();
  const escrowsDb = new Map<string, EscrowTransaction>();
  const walletsDb = new Map<string, Wallet>();
  const ledgersDb: TransactionLedger[] = [];

  const mockUserRepo: IUserRepository = {
    async findById(id: string) {
      if (id === playerAId) return User.create(playerAId, 'playerA@esports.io', null, 'email');
      if (id === playerBId) return User.create(playerBId, 'playerB@esports.io', null, 'email');
      if (id === adminId) return User.create(adminId, 'admin@trustvault.io', null, 'email');
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

  const mockChallengeRepo: IGamingChallengeRepository = {
    async findById(id: string) { return challengesDb.get(id) ?? null; },
    async findOpenChallenges() {
      return Array.from(challengesDb.values()).filter((c) => c.status === 'OPEN');
    },
    async findByUserId(userId: string) {
      return Array.from(challengesDb.values()).filter(
        (c) => c.challengerId === userId || c.opponentId === userId,
      );
    },
    async create(c: GamingChallenge) { challengesDb.set(c.id, c); },
    async update(c: GamingChallenge) { challengesDb.set(c.id, c); },
  };

  const mockMatchResultRepo: IMatchResultRepository = {
    async findById(id: string) { return matchResultsDb.get(id) ?? null; },
    async findByChallengeId(challengeId: string) {
      return Array.from(matchResultsDb.values()).filter((r) => r.challengeId === challengeId);
    },
    async create(r: MatchResult) { matchResultsDb.set(r.id, r); },
    async update(r: MatchResult) { matchResultsDb.set(r.id, r); },
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
    // Seed initial player wallets with ₹1,000 each (100,000 paise)
    const walletA = Wallet.create('w-a', playerAId);
    walletA.credit(100000);
    walletsDb.set(walletA.id, walletA);

    const walletB = Wallet.create('w-b', playerBId);
    walletB.credit(100000);
    walletsDb.set(walletB.id, walletB);

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
      gamingChallengeRepository: mockChallengeRepo,
      matchResultRepository: mockMatchResultRepo,
      auditLogger: mockAuditLogger,
      transactionLedgerRepository: mockLedgerRepo,
      escrowQueue: mockEscrowQueue,
    });
  });

  // Helper to create and accept a match with 20,000 paise stake (₹200 per player)
  async function setupActiveMatch(stake = 20000): Promise<string> {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/gaming/challenges',
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: {
        gameTitle: 'Valorant 1v1',
        stakeAmount: stake,
      },
    });
    const challengeId = JSON.parse(createRes.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/accept`,
      headers: { authorization: `Bearer mock-token-${playerBId}` },
    });

    return challengeId;
  }

  // ── Scenario 1: Dual Consensus — Player A Wins ───────────────
  it('Scenario 1: Dual consensus where both players report Player A won -> Player A receives pot minus 5% fee', async () => {
    const challengeId = await setupActiveMatch(20000); // 20k each -> 40k pot

    // Player A reports: A won
    const resA = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: { claimedWinnerId: playerAId },
    });
    expect(resA.statusCode).toBe(200);
    expect(JSON.parse(resA.body).data.settlementScenario).toBe('FIRST_REPORT_AWAITING_OPPONENT');

    // Player B reports: A won (Dual consensus!)
    const resB = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerBId}` },
      payload: { claimedWinnerId: playerAId },
    });
    expect(resB.statusCode).toBe(200);
    const body = JSON.parse(resB.body);
    expect(body.data.settlementScenario).toBe('DUAL_CONSENSUS');
    expect(body.data.winnerId).toBe(playerAId);
    expect(body.data.platformFee).toBe(2000); // 5% of 40,000
    expect(body.data.payoutAmount).toBe(38000); // 40,000 - 2,000

    const challenge = challengesDb.get(challengeId);
    expect(challenge?.status).toBe('COMPLETED');
  });

  // ── Scenario 2: Dual Consensus — Player B Wins ───────────────
  it('Scenario 2: Dual consensus where both players report Player B won -> Player B receives pot minus 5% fee', async () => {
    const challengeId = await setupActiveMatch(10000); // 10k each -> 20k pot

    // Player B reports B won
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerBId}` },
      payload: { claimedWinnerId: playerBId },
    });

    // Player A reports B won (Consensus!)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: { claimedWinnerId: playerBId },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.settlementScenario).toBe('DUAL_CONSENSUS');
    expect(body.data.winnerId).toBe(playerBId);
    expect(body.data.platformFee).toBe(1000); // 5% of 20,000
    expect(body.data.payoutAmount).toBe(19000); // 20,000 - 1,000
  });

  // ── Scenario 3: One-Sided Timeout Win ─────────────────────────
  it('Scenario 3: Player A reports win; Player B times out after 30 minutes -> Player A claims auto-win', async () => {
    const challengeId = await setupActiveMatch(15000); // 30k pot

    // Player A reports
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: { claimedWinnerId: playerAId },
    });

    // Attempting to claim timeout BEFORE 30m expires must fail
    const prematureClaim = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/claim-timeout`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
    });
    expect(prematureClaim.statusCode).toBe(400);

    // Fast-forward response deadline in mock DB to simulate 30m expiry
    const challenge = challengesDb.get(challengeId)!;
    challenge.reportFirstResult(new Date(Date.now() - 5000));
    challengesDb.set(challengeId, challenge);

    // Claim timeout after 30m
    const claimRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/claim-timeout`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
    });
    expect(claimRes.statusCode).toBe(200);
    const body = JSON.parse(claimRes.body);
    expect(body.data.settlementScenario).toBe('ONE_SIDED_TIMEOUT');
    expect(body.data.winnerId).toBe(playerAId);
    expect(body.data.payoutAmount).toBe(28500); // 30,000 - 5% (1,500)
    expect(challenge.status).toBe('COMPLETED');
  });

  // ── Scenario 4: Dispute Resolved for Player A ─────────────────
  it('Scenario 4: Conflicting reports escalate to dispute -> Admin resolves for Player A', async () => {
    const challengeId = await setupActiveMatch(10000);

    // Player A reports A won
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: { claimedWinnerId: playerAId },
    });

    // Player B reports B won (Conflict!)
    const conflictRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerBId}` },
      payload: { claimedWinnerId: playerBId },
    });
    expect(conflictRes.statusCode).toBe(200);
    expect(JSON.parse(conflictRes.body).data.settlementScenario).toBe('CONFLICTING_REPORTS_DISPUTED');

    // Admin resolves in favor of Player A
    const resolveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/resolve`,
      headers: { authorization: `Bearer mock-token-${adminId}` },
      payload: {
        resolvedWinnerId: playerAId,
        reason: 'Verified Player A stream telemetry',
      },
    });
    expect(resolveRes.statusCode).toBe(200);
    const body = JSON.parse(resolveRes.body);
    expect(body.data.settlementScenario).toBe('DISPUTE_RESOLVED_CHALLENGER');
    expect(body.data.winnerId).toBe(playerAId);
    expect(body.data.payoutAmount).toBe(19000);
  });

  // ── Scenario 5: Dispute Resolved with 10% Slash Penalty ───────
  it('Scenario 5: Player A submits fake evidence -> AI detects fraud -> 10% slash penalty applied to Player A', async () => {
    const challengeId = await setupActiveMatch(20000);

    // Player A submits fake screenshot proof
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
      payload: {
        claimedWinnerId: playerAId,
        evidenceUrl: 'https://storage.trustvault.io/fake-edited-scoreboard.png',
      },
    });

    // Player B reports B won
    await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/report`,
      headers: { authorization: `Bearer mock-token-${playerBId}` },
      payload: {
        claimedWinnerId: playerBId,
        evidenceUrl: 'https://storage.trustvault.io/authentic-match.png',
      },
    });

    // Resolve dispute for Player B with slash penalty
    const resolveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/resolve`,
      headers: { authorization: `Bearer mock-token-${adminId}` },
      payload: {
        resolvedWinnerId: playerBId,
        slashFraudulentStake: true,
        fraudulentPartyId: playerAId,
        reason: 'Fraudulent pixel manipulation detected on Player A screenshot',
      },
    });

    expect(resolveRes.statusCode).toBe(200);
    const body = JSON.parse(resolveRes.body);
    expect(body.data.settlementScenario).toBe('DISPUTE_RESOLVED_OPPONENT');
    expect(body.data.winnerId).toBe(playerBId);
    expect(body.data.slashedAmount).toBe(2000); // 10% of 20,000 stake
    expect(body.data.payoutAmount).toBe(38000);
  });

  // ── Scenario 6: Mutual Cancellation ───────────────────────────
  it('Scenario 6: Both players mutually cancel -> Full refund of stakes back to both wallets', async () => {
    const challengeId = await setupActiveMatch(10000);

    const initialBalanceA = (await mockWalletRepo.findByUserId(playerAId))!.availableBalance;
    const initialBalanceB = (await mockWalletRepo.findByUserId(playerBId))!.availableBalance;

    const cancelRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gaming/challenges/${challengeId}/cancel`,
      headers: { authorization: `Bearer mock-token-${playerAId}` },
    });

    expect(cancelRes.statusCode).toBe(200);
    const body = JSON.parse(cancelRes.body);
    expect(body.data.settlementScenario).toBe('MUTUAL_CANCELLATION');

    const challenge = challengesDb.get(challengeId);
    expect(challenge?.status).toBe('CANCELLED');

    // Both players refunded
    const updatedWalletA = await mockWalletRepo.findByUserId(playerAId);
    const updatedWalletB = await mockWalletRepo.findByUserId(playerBId);
    expect(updatedWalletA?.availableBalance).toBe(initialBalanceA + 10000);
    expect(updatedWalletB?.availableBalance).toBe(initialBalanceB + 10000);
  });
});
