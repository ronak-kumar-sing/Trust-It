-- ================================================================
-- Trust Platform — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- 
-- Creates all 12 core tables with foreign keys, indexes,
-- enums, triggers, and Row Level Security (RLS) policies.
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. CUSTOM TYPES (PostgreSQL enums)
-- ────────────────────────────────────────────────────────────────

CREATE TYPE kyc_status AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE escrow_status AS ENUM (
  'INITIATED', 'FUNDED_IN_ESCROW', 'DELIVERED',
  'INSPECTION_PERIOD', 'DISPUTED', 'RELEASED',
  'REFUNDED', 'CANCELLED'
);
CREATE TYPE escrow_type AS ENUM ('DIGITAL_GOODS', 'FREELANCE_MILESTONE', 'GAMING_WAGER');
CREATE TYPE transaction_type AS ENUM (
  'DEPOSIT', 'WITHDRAWAL', 'ESCROW_FREEZE', 'ESCROW_RELEASE',
  'ESCROW_REFUND', 'PLATFORM_FEE', 'DISPUTE_DEPOSIT',
  'DISPUTE_REFUND', 'SLASH_PENALTY'
);
CREATE TYPE dispute_status AS ENUM (
  'OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER_WINS',
  'RESOLVED_SELLER_WINS', 'RESOLVED_SPLIT', 'CANCELLED'
);
CREATE TYPE dispute_tier AS ENUM ('TIER_1_AI', 'TIER_2_MEDIATOR', 'TIER_3_PANEL');
CREATE TYPE listing_status AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'SUSPENDED', 'CANCELLED');
CREATE TYPE listing_category AS ENUM (
  'GAMING_ACCOUNT', 'API_KEY', 'SOCIAL_MEDIA_HANDLE',
  'DIGITAL_LICENSE', 'DOMAIN_NAME', 'OTHER'
);
CREATE TYPE project_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE milestone_status AS ENUM (
  'PENDING', 'FUNDED', 'IN_PROGRESS', 'SUBMITTED',
  'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED',
  'RELEASED', 'DISPUTED', 'CANCELLED'
);
CREATE TYPE challenge_status AS ENUM (
  'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESULTS_REPORTED',
  'CONSENSUS_REACHED', 'DISPUTED', 'COMPLETED',
  'CANCELLED', 'EXPIRED'
);
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'INCONCLUSIVE');

-- ────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ────────────────────────────────────────────────────────────────

-- 2.1 Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  kyc_status kyc_status NOT NULL DEFAULT 'UNVERIFIED',
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  auth_provider TEXT NOT NULL DEFAULT 'phone',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance BIGINT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  frozen_balance BIGINT NOT NULL DEFAULT 0 CHECK (frozen_balance >= 0),
  total_earned BIGINT NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent BIGINT NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Transactions Ledger (immutable audit trail)
CREATE TABLE transactions_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  balance_after BIGINT NOT NULL,
  reference_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Trust Scores
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  identity_score INTEGER NOT NULL DEFAULT 0 CHECK (identity_score >= 0 AND identity_score <= 25),
  behavior_score INTEGER NOT NULL DEFAULT 0 CHECK (behavior_score >= 0 AND behavior_score <= 25),
  history_score INTEGER NOT NULL DEFAULT 0 CHECK (history_score >= 0 AND history_score <= 50),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Escrow Transactions
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type escrow_type NOT NULL,
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  platform_fee BIGINT NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  status escrow_status NOT NULL DEFAULT 'INITIATED',
  inspection_deadline TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_parties CHECK (buyer_id != seller_id)
);

-- 2.6 Digital Goods Listings
CREATE TABLE digital_goods_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT NOT NULL DEFAULT '',
  price BIGINT NOT NULL CHECK (price > 0),
  category listing_category NOT NULL DEFAULT 'OTHER',
  status listing_status NOT NULL DEFAULT 'DRAFT',
  verification_report JSONB,
  insurance_opted BOOLEAN NOT NULL DEFAULT false,
  escrow_transaction_id UUID REFERENCES escrow_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Projects (Freelance)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  freelancer_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT NOT NULL DEFAULT '',
  total_budget BIGINT NOT NULL CHECK (total_budget > 0),
  status project_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_project_parties CHECK (client_id != freelancer_id)
);

-- 2.8 Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT NOT NULL DEFAULT '',
  amount BIGINT NOT NULL CHECK (amount > 0),
  sow_text TEXT NOT NULL DEFAULT '',
  status milestone_status NOT NULL DEFAULT 'PENDING',
  quality_gate_result JSONB,
  submission_url TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0 AND revision_count <= 3),
  escrow_transaction_id UUID REFERENCES escrow_transactions(id),
  review_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Gaming Challenges
CREATE TABLE gaming_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES users(id),
  opponent_id UUID REFERENCES users(id),
  game_title TEXT NOT NULL CHECK (length(game_title) >= 1 AND length(game_title) <= 100),
  stake_amount BIGINT NOT NULL CHECK (stake_amount > 0),
  rules JSONB NOT NULL DEFAULT '{}',
  status challenge_status NOT NULL DEFAULT 'OPEN',
  escrow_transaction_id UUID REFERENCES escrow_transactions(id),
  response_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 Match Results
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES gaming_challenges(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),
  claimed_winner_id UUID NOT NULL REFERENCES users(id),
  evidence_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  ai_confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES escrow_transactions(id),
  filed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL CHECK (length(reason) >= 10),
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  resolution_tier dispute_tier NOT NULL DEFAULT 'TIER_1_AI',
  status dispute_status NOT NULL DEFAULT 'OPEN',
  deposit_amount BIGINT NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12 Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.13 Audit Logs (immutable — no UPDATE/DELETE)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.14 Idempotency Keys (for mutation deduplication)
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

-- ────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ────────────────────────────────────────────────────────────────

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transactions Ledger
CREATE INDEX idx_ledger_wallet_id ON transactions_ledger(wallet_id);
CREATE INDEX idx_ledger_created_at ON transactions_ledger(created_at DESC);
CREATE INDEX idx_ledger_reference_id ON transactions_ledger(reference_id);

-- Trust Scores
CREATE INDEX idx_trust_scores_user_id ON trust_scores(user_id);

-- Escrow Transactions
CREATE INDEX idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_created_at ON escrow_transactions(created_at DESC);

-- Digital Goods Listings
CREATE INDEX idx_listings_seller_id ON digital_goods_listings(seller_id);
CREATE INDEX idx_listings_status ON digital_goods_listings(status);
CREATE INDEX idx_listings_category ON digital_goods_listings(category);
CREATE INDEX idx_listings_created_at ON digital_goods_listings(created_at DESC);

-- Projects
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Milestones
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);

-- Gaming Challenges
CREATE INDEX idx_challenges_challenger_id ON gaming_challenges(challenger_id);
CREATE INDEX idx_challenges_opponent_id ON gaming_challenges(opponent_id);
CREATE INDEX idx_challenges_status ON gaming_challenges(status);

-- Match Results
CREATE INDEX idx_match_results_challenge_id ON match_results(challenge_id);

-- Disputes
CREATE INDEX idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- Idempotency Keys
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- ────────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_escrow_updated_at BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON digital_goods_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_challenges_updated_at BEFORE UPDATE ON gaming_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_goods_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- ── Users ──
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY users_select_public ON users FOR SELECT
  USING (true);  -- Public profiles are readable
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY users_insert_self ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── Wallets ──
CREATE POLICY wallets_select_own ON wallets FOR SELECT
  USING (auth.uid() = user_id);
-- Wallet mutations are service-role only (no user-facing INSERT/UPDATE/DELETE policies)

-- ── Transactions Ledger ──
CREATE POLICY ledger_select_own ON transactions_ledger FOR SELECT
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));
-- Ledger is INSERT-only via service role

-- ── Trust Scores ──
CREATE POLICY trust_select_own ON trust_scores FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY trust_select_public ON trust_scores FOR SELECT
  USING (true);  -- Trust scores are public

-- ── Escrow Transactions ──
CREATE POLICY escrow_select_participant ON escrow_transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ── Digital Goods Listings ──
CREATE POLICY listings_select_all ON digital_goods_listings FOR SELECT
  USING (status = 'ACTIVE' OR seller_id = auth.uid());
CREATE POLICY listings_insert_seller ON digital_goods_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY listings_update_seller ON digital_goods_listings FOR UPDATE
  USING (auth.uid() = seller_id);

-- ── Projects ──
CREATE POLICY projects_select_participant ON projects FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);
CREATE POLICY projects_insert_client ON projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- ── Milestones ──
CREATE POLICY milestones_select_project ON milestones FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
  ));

-- ── Gaming Challenges ──
CREATE POLICY challenges_select_all ON gaming_challenges FOR SELECT
  USING (status = 'OPEN' OR challenger_id = auth.uid() OR opponent_id = auth.uid());
CREATE POLICY challenges_insert ON gaming_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- ── Match Results ──
CREATE POLICY results_select_participant ON match_results FOR SELECT
  USING (challenge_id IN (
    SELECT id FROM gaming_challenges
    WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
  ));
CREATE POLICY results_insert_participant ON match_results FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ── Disputes ──
CREATE POLICY disputes_select_participant ON disputes FOR SELECT
  USING (transaction_id IN (
    SELECT id FROM escrow_transactions
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  ));
CREATE POLICY disputes_insert_filer ON disputes FOR INSERT
  WITH CHECK (auth.uid() = filed_by);

-- ── Notifications ──
CREATE POLICY notifications_select_own ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Audit Logs ── (service-role only — no user policies)
-- ── Idempotency Keys ── (service-role only)

-- ────────────────────────────────────────────────────────────────
-- 6. SERVICE ROLE POLICIES (for backend server)
-- ────────────────────────────────────────────────────────────────
-- The service_role key bypasses RLS by default in Supabase.
-- No additional policies needed for server-side operations.

-- ────────────────────────────────────────────────────────────────
-- 7. CLEANUP FUNCTION FOR EXPIRED IDEMPOTENCY KEYS
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
