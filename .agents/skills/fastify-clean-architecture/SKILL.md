---
name: fastify-clean-architecture
description: >-
  Production-grade Fastify + TypeScript + Supabase + BullMQ backend patterns.
  Use when building API routes, use cases, repositories, middleware, queue workers,
  or any backend module. Covers Clean Architecture layering, Fastify plugin system,
  Supabase client configuration, Zod validation, structured logging, error handling,
  idempotency enforcement, and TypeScript strict-mode compliance.
metadata:
  author: trust-platform
  version: "1.0"
  stack: "Node.js 26+ | Fastify 5 | TypeScript Strict | Supabase | BullMQ | Vitest"
---

# Fastify Clean Architecture — Backend Implementation Skill

Production patterns for building the Trust Platform API. Every code artifact
must follow these patterns strictly. No exceptions.

---

## 1. Clean Architecture Layer Rules

### Layer Dependencies (STRICT — violations are build failures)

```
Presentation → Application → Domain
Infrastructure → Application → Domain
```

| Layer              | Can Import From        | NEVER Imports           |
|--------------------|------------------------|------------------------|
| `domain/`          | Nothing (zero deps)    | application, infra, presentation |
| `application/`     | `domain/` only         | infra, presentation     |
| `infrastructure/`  | `domain/`, `application/` | presentation          |
| `presentation/`    | `domain/`, `application/` | infrastructure (via DI) |
| `shared/`          | Nothing external       | Any layer               |

### Domain Layer (`src/domain/`)

The domain layer is the core. It has **zero external dependencies** — no npm
packages, no framework imports, no database clients.

```typescript
// ✅ CORRECT — Pure domain entity
export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _availableBalance: number,
    private _frozenBalance: number,
  ) {}

  /** @throws {InsufficientFundsError} if amount exceeds available balance */
  public freeze(amount: number): void {
    if (amount <= 0) throw new InvalidAmountError(amount);
    if (amount > this._availableBalance) {
      throw new InsufficientFundsError(this._availableBalance, amount);
    }
    this._availableBalance -= amount;
    this._frozenBalance += amount;
  }

  public static create(id: string, userId: string): Wallet {
    return new Wallet(id, userId, 0, 0);
  }
}

// ❌ WRONG — Domain importing infrastructure
import { supabase } from '../infrastructure/database/client';
```

### Application Layer (`src/application/`)

Use cases orchestrate domain entities. They depend on **interfaces** (ports),
never concrete implementations.

```typescript
// ✅ CORRECT — Use case depends on interface
import type { IWalletRepository } from '../interfaces/IWalletRepository';
import type { IAuditLogger } from '../interfaces/IAuditLogger';

export class FreezeForEscrow {
  constructor(
    private readonly walletRepo: IWalletRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: FreezeForEscrowDTO): Promise<FreezeResult> {
    const wallet = await this.walletRepo.findByUserId(dto.userId);
    if (!wallet) throw new WalletNotFoundError(dto.userId);

    wallet.freeze(dto.amount);
    await this.walletRepo.save(wallet);
    await this.auditLogger.log({
      entity: 'wallet',
      entityId: wallet.id,
      action: 'FREEZE',
      amount: dto.amount,
      actorId: dto.userId,
    });

    return { frozenAmount: dto.amount, newBalance: wallet.availableBalance };
  }
}
```

### Infrastructure Layer (`src/infrastructure/`)

Concrete implementations of ports — database repositories, queue adapters,
payment gateways, AI service stubs.

```typescript
// ✅ CORRECT — Infrastructure implements application interface
import type { IWalletRepository } from '../../application/interfaces/IWalletRepository';
import type { Wallet } from '../../domain/entities/Wallet';
import { supabaseAdmin } from './supabaseClient';

export class SupabaseWalletRepository implements IWalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new DatabaseError('findByUserId', error);
    }
    return WalletMapper.toDomain(data);
  }
}
```

### Presentation Layer (`src/presentation/`)

HTTP routes, controllers, request validation, response serialization.
Receives infrastructure via **dependency injection**, never imports it directly.

```typescript
// ✅ CORRECT — Controller receives use case via DI
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FreezeForEscrow } from '../../application/use-cases/wallet/FreezeForEscrow';

export function createWalletController(freezeForEscrow: FreezeForEscrow) {
  return {
    async freeze(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const dto = request.body as FreezeForEscrowDTO;
      const result = await freezeForEscrow.execute(dto);
      await reply.status(200).send(result);
    },
  };
}
```

---

## 2. Fastify Patterns

### Plugin-Based Architecture

Every feature module must be a Fastify plugin. This provides encapsulation,
testability, and clean dependency injection.

```typescript
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export default fp(async function walletPlugin(fastify: FastifyInstance) {
  // 1. Create infrastructure
  const walletRepo = new SupabaseWalletRepository();
  const auditLogger = new SupabaseAuditLogger();

  // 2. Create use cases with injected dependencies
  const freezeForEscrow = new FreezeForEscrow(walletRepo, auditLogger);

  // 3. Create controller with injected use case
  const controller = createWalletController(freezeForEscrow);

  // 4. Register routes
  fastify.post('/api/v1/wallet/freeze', {
    preHandler: [fastify.authenticate],
    schema: freezeSchema,
    handler: controller.freeze,
  });
}, { name: 'wallet-plugin' });
```

### Request Validation with Zod + TypeBox

Define schemas once, derive TypeScript types automatically.

```typescript
import { z } from 'zod';

/** Zod schema for freeze escrow request body */
export const FreezeForEscrowSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().int(),
  escrowTransactionId: z.string().uuid(),
  idempotencyKey: z.string().min(16).max(64),
});

export type FreezeForEscrowDTO = z.infer<typeof FreezeForEscrowSchema>;

// In route definition — validate BEFORE controller
fastify.post('/api/v1/wallet/freeze', {
  preHandler: async (request) => {
    request.body = FreezeForEscrowSchema.parse(request.body);
  },
  handler: controller.freeze,
});
```

### Structured Error Handling

```typescript
// src/shared/errors/AppError.ts
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;

  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`);
  }
}

// Global error handler in Fastify
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError && error.isOperational) {
    request.log.warn({ err: error }, error.message);
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Unexpected errors — log full stack, return generic 500
  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});
```

---

## 3. Supabase Backend Patterns

### Client Initialization

```typescript
// src/infrastructure/database/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Admin client — bypasses RLS. Use for server-side operations ONLY. */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  },
);

/**
 * Create a user-scoped client that respects RLS.
 * Use when the operation should be restricted to the user's own data.
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    },
  );
}
```

### Type Generation

Always regenerate types after schema changes:
```bash
npx supabase gen types typescript --project-id <ref> > src/infrastructure/database/database.types.ts
```

### Repository Pattern with Error Handling

```typescript
async save(wallet: Wallet): Promise<void> {
  const row = WalletMapper.toPersistence(wallet);
  const { error } = await supabaseAdmin
    .from('wallets')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    throw new DatabaseError('save wallet', error);
  }
}
```

---

## 4. BullMQ Queue Patterns

### Queue Configuration (Upstash Redis)

```typescript
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection: ConnectionOptions = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});

export const escrowQueue = new Queue('escrow-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
```

### Job Definitions (Type-Safe)

```typescript
// src/infrastructure/queue/jobTypes.ts
export interface AutoReleaseJobData {
  escrowTransactionId: string;
  scheduledAt: string;
}

export interface AIVerificationJobData {
  type: 'credential' | 'code-quality' | 'match' | 'ghosting';
  entityId: string;
  payload: Record<string, unknown>;
}

export type EscrowJobData = AutoReleaseJobData | AIVerificationJobData;
```

### Worker with Graceful Shutdown

```typescript
const worker = new Worker<AutoReleaseJobData>(
  'escrow-jobs',
  async (job) => {
    const { escrowTransactionId } = job.data;
    job.log(`Processing auto-release for ${escrowTransactionId}`);

    const useCase = new TransitionEscrowState(escrowRepo, walletService);
    await useCase.execute({
      transactionId: escrowTransactionId,
      targetState: 'RELEASED',
      actor: 'SYSTEM_TIMER',
    });
  },
  { connection, concurrency: 5 },
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
```

---

## 5. Idempotency Enforcement

All mutation endpoints MUST enforce `Idempotency-Key` headers.

```typescript
// src/presentation/middleware/idempotencyMiddleware.ts
import type { FastifyRequest, FastifyReply } from 'fastify';

const IDEMPOTENCY_CACHE = new Map<string, { status: number; body: unknown }>();

export async function idempotencyGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.method !== 'POST' && request.method !== 'PUT') return;

  const key = request.headers['idempotency-key'] as string | undefined;
  if (!key) {
    return reply.status(400).send({
      error: 'MISSING_IDEMPOTENCY_KEY',
      message: 'Idempotency-Key header is required for mutation requests',
    });
  }

  const cached = IDEMPOTENCY_CACHE.get(key);
  if (cached) {
    return reply.status(cached.status).send(cached.body);
  }
}
```

---

## 6. Audit Trail Pattern

Every financial state change emits an immutable audit event.

```typescript
// src/application/interfaces/IAuditLogger.ts
export interface AuditEvent {
  entity: string;
  entityId: string;
  action: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface IAuditLogger {
  log(event: AuditEvent): Promise<void>;
}

// Infrastructure implementation
export class SupabaseAuditLogger implements IAuditLogger {
  async log(event: AuditEvent): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      entity: event.entity,
      entity_id: event.entityId,
      action: event.action,
      actor_id: event.actorId,
      metadata: event.metadata ?? {},
      created_at: event.timestamp ?? new Date().toISOString(),
    });
  }
}
```

---

## 7. TypeScript Strict Mode Requirements

### tsconfig.json (Non-Negotiable)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

### Banned Patterns

```typescript
// ❌ NEVER — untyped any
function handle(data: any) {}

// ✅ Use unknown + validation
function handle(data: unknown): void {
  const validated = FreezeSchema.parse(data);
}

// ❌ NEVER — non-null assertion without guard
const user = result!;

// ✅ Explicit null check
if (!result) throw new NotFoundError('User', id);
const user = result;

// ❌ NEVER — type assertion without validation
const body = request.body as CreateListingDTO;

// ✅ Validate then type
const body = CreateListingSchema.parse(request.body);
```

---

## 8. JSDoc Requirements

Every exported function, class, interface, and method MUST have JSDoc:

```typescript
/**
 * Freezes funds in a user's wallet for an escrow transaction.
 *
 * @param dto - The freeze request containing userId, amount, and escrowTransactionId
 * @returns The result containing the frozen amount and new available balance
 * @throws {WalletNotFoundError} When no wallet exists for the given userId
 * @throws {InsufficientFundsError} When available balance is less than the freeze amount
 * @throws {InvalidAmountError} When the amount is zero or negative
 */
async execute(dto: FreezeForEscrowDTO): Promise<FreezeResult> {
  // ...
}
```

---

## 9. Environment Configuration

Validate all env vars at startup with Zod:

```typescript
// src/shared/config.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  REDIS_URL: z.string().url(),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadConfig(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}
```

---

## 10. Testing Patterns

### Unit Test Structure (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FreezeForEscrow } from './FreezeForEscrow';
import { Wallet } from '../../../domain/entities/Wallet';

describe('FreezeForEscrow', () => {
  const mockWalletRepo = {
    findByUserId: vi.fn(),
    save: vi.fn(),
  };
  const mockAuditLogger = { log: vi.fn() };
  let useCase: FreezeForEscrow;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new FreezeForEscrow(mockWalletRepo, mockAuditLogger);
  });

  it('should freeze the specified amount', async () => {
    const wallet = Wallet.create('w1', 'u1');
    wallet.credit(10000); // Add funds first
    mockWalletRepo.findByUserId.mockResolvedValue(wallet);

    const result = await useCase.execute({
      userId: 'u1',
      amount: 5000,
      escrowTransactionId: 'e1',
      idempotencyKey: 'key-123',
    });

    expect(result.frozenAmount).toBe(5000);
    expect(mockWalletRepo.save).toHaveBeenCalledWith(wallet);
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FREEZE', amount: 5000 }),
    );
  });

  it('should throw WalletNotFoundError if wallet does not exist', async () => {
    mockWalletRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute({
      userId: 'nonexistent',
      amount: 1000,
      escrowTransactionId: 'e1',
      idempotencyKey: 'key-456',
    })).rejects.toThrow('WalletNotFoundError');
  });
});
```

### Integration Test with Fastify inject()

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';

describe('Wallet API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/wallet/balance returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet/balance',
    });
    expect(response.statusCode).toBe(401);
  });
});
```

---

## Checklist — Apply Before Every File

- [ ] File is in the correct Clean Architecture layer
- [ ] No cross-layer import violations
- [ ] TypeScript strict mode — zero `any`, zero non-null assertions without guards
- [ ] JSDoc on every export
- [ ] Zod validation on every request handler
- [ ] Idempotency-Key enforced on mutations
- [ ] Audit event emitted for financial state changes
- [ ] Unit test written (`.spec.ts` alongside or in `tests/unit/`)
- [ ] Error cases use AppError subclasses, not raw throws
- [ ] Structured logging via Fastify's built-in Pino logger
