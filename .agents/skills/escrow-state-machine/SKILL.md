---
name: escrow-state-machine
description: >-
  Deterministic escrow state machine patterns for financial transactions.
  Use when implementing escrow lifecycle, state transitions, fund freezing/releasing,
  dispute handling, auto-release timers, or any financial workflow that requires
  strict state management, optimistic locking, and audit trails.
metadata:
  author: trust-platform
  version: "1.0"
  domain: "financial-transactions"
---

# Escrow State Machine — Financial Transaction Patterns

Strict patterns for implementing deterministic escrow state machines.
Every financial state transition MUST follow these rules. No exceptions.

---

## 1. State Machine Definition

### Master State Enum (Single Source of Truth)

```typescript
// src/domain/enums/EscrowStatus.ts

/** All possible escrow transaction states */
export const EscrowStatus = {
  INITIATED: 'INITIATED',
  FUNDED_IN_ESCROW: 'FUNDED_IN_ESCROW',
  DELIVERED: 'DELIVERED',
  INSPECTION_PERIOD: 'INSPECTION_PERIOD',
  DISPUTED: 'DISPUTED',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export type EscrowStatusType = typeof EscrowStatus[keyof typeof EscrowStatus];
```

### Transition Table (The Law)

```typescript
// src/domain/value-objects/EscrowTransitions.ts

/**
 * Defines ALL valid state transitions.
 * Any transition NOT in this table is ILLEGAL and must be rejected.
 */
export const VALID_TRANSITIONS: Record<EscrowStatusType, readonly EscrowStatusType[]> = {
  INITIATED:           ['FUNDED_IN_ESCROW', 'CANCELLED'],
  FUNDED_IN_ESCROW:    ['DELIVERED', 'CANCELLED', 'REFUNDED'],
  DELIVERED:           ['INSPECTION_PERIOD'],
  INSPECTION_PERIOD:   ['RELEASED', 'DISPUTED', 'REFUNDED'],
  DISPUTED:            ['RELEASED', 'REFUNDED'],
  RELEASED:            [],  // Terminal state
  REFUNDED:            [],  // Terminal state
  CANCELLED:           [],  // Terminal state
} as const;

/**
 * Validates if a state transition is legal.
 * @throws {IllegalStateTransitionError} if the transition is not allowed
 */
export function assertValidTransition(
  from: EscrowStatusType,
  to: EscrowStatusType,
): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new IllegalStateTransitionError(from, to);
  }
}
```

### State Machine Visualization

```
┌──────────┐     fund      ┌────────────────┐
│ INITIATED├──────────────►│ FUNDED_IN_ESCROW│
└────┬─────┘               └───────┬────────┘
     │ cancel                      │ deliver / cancel / refund
     ▼                             ▼
┌──────────┐              ┌──────────┐
│ CANCELLED│              │ DELIVERED│
└──────────┘              └────┬─────┘
                               │ start inspection
                               ▼
                   ┌────────────────────┐
                   │ INSPECTION_PERIOD  │
                   └──┬───────┬────────┘
                      │       │ dispute
              approve │       ▼
                      │  ┌──────────┐
                      │  │ DISPUTED │
                      │  └──┬────┬──┘
                      │     │    │
                      ▼     ▼    ▼
                 ┌────────┐ ┌────────┐
                 │RELEASED│ │REFUNDED│
                 └────────┘ └────────┘
```

---

## 2. Entity Implementation

### EscrowTransaction Entity

```typescript
// src/domain/entities/EscrowTransaction.ts

export class EscrowTransaction {
  private constructor(
    public readonly id: string,
    public readonly type: EscrowType,
    public readonly buyerId: string,
    public readonly sellerId: string,
    public readonly amount: number,
    private _status: EscrowStatusType,
    private _version: number,
    public readonly inspectionDeadline: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /** Current status — read-only outside the entity */
  get status(): EscrowStatusType {
    return this._status;
  }

  /** Optimistic locking version */
  get version(): number {
    return this._version;
  }

  /**
   * Transitions the escrow to a new state.
   * Validates the transition against the transition table.
   * Increments the version for optimistic locking.
   *
   * @param targetState - The desired new state
   * @param actor - Who is triggering this transition (userId or 'SYSTEM_TIMER')
   * @throws {IllegalStateTransitionError} if the transition is invalid
   * @returns The state change event for audit logging
   */
  public transition(
    targetState: EscrowStatusType,
    actor: string,
  ): StateChangeEvent {
    assertValidTransition(this._status, targetState);

    const event: StateChangeEvent = {
      entityId: this.id,
      fromState: this._status,
      toState: targetState,
      actorId: actor,
      timestamp: new Date().toISOString(),
    };

    this._status = targetState;
    this._version += 1;

    return event;
  }

  /** Whether the transaction is in a terminal state */
  get isTerminal(): boolean {
    return ['RELEASED', 'REFUNDED', 'CANCELLED'].includes(this._status);
  }

  /** Whether the transaction is currently disputable */
  get isDisputable(): boolean {
    return this._status === 'INSPECTION_PERIOD';
  }

  /** Whether the inspection window has expired */
  isInspectionExpired(now: Date = new Date()): boolean {
    if (this._status !== 'INSPECTION_PERIOD') return false;
    if (!this.inspectionDeadline) return false;
    return now >= this.inspectionDeadline;
  }
}
```

---

## 3. Optimistic Locking (MANDATORY for Financial Operations)

Never update financial records without checking the version. This prevents
race conditions where two concurrent requests both try to release the same funds.

```typescript
// In SupabaseEscrowRepository
async save(transaction: EscrowTransaction): Promise<void> {
  const previousVersion = transaction.version - 1; // Version was incremented by transition()

  const { data, error } = await supabaseAdmin
    .from('escrow_transactions')
    .update({
      status: transaction.status,
      version: transaction.version,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.id)
    .eq('version', previousVersion)  // ← Optimistic lock check
    .select()
    .single();

  if (error || !data) {
    throw new ConcurrencyError(
      `Escrow ${transaction.id} was modified by another process`
    );
  }
}
```

---

## 4. Side Effects Per Transition

Each state transition triggers specific side effects. These MUST be executed
within the same use case, atomically where possible.

| Transition | Side Effects |
|------------|-------------|
| `INITIATED → FUNDED_IN_ESCROW` | Freeze buyer's wallet, create ledger entry |
| `FUNDED_IN_ESCROW → DELIVERED` | Queue AI verification job, notify buyer |
| `DELIVERED → INSPECTION_PERIOD` | Start inspection timer (BullMQ delayed job) |
| `INSPECTION_PERIOD → RELEASED` | Release funds to seller wallet, credit ledger, update trust scores |
| `INSPECTION_PERIOD → DISPUTED` | Freeze funds (keep in escrow), create dispute record, notify mediator |
| `DISPUTED → RELEASED` | Release to seller, close dispute, update trust scores |
| `DISPUTED → REFUNDED` | Refund to buyer, close dispute, penalize seller trust score |
| `* → CANCELLED` | Refund if funded, restore wallet balance |

### Implementation Pattern

```typescript
// src/application/use-cases/escrow/TransitionEscrowState.ts

export class TransitionEscrowState {
  async execute(dto: TransitionDTO): Promise<TransitionResult> {
    // 1. Load entity (with current version)
    const escrow = await this.escrowRepo.findById(dto.transactionId);
    if (!escrow) throw new EscrowNotFoundError(dto.transactionId);

    // 2. Validate & transition (domain logic)
    const event = escrow.transition(dto.targetState, dto.actor);

    // 3. Execute side effects based on the transition
    await this.executeSideEffects(escrow, event);

    // 4. Save with optimistic locking
    await this.escrowRepo.save(escrow);

    // 5. Emit audit event
    await this.auditLogger.log({
      entity: 'escrow_transaction',
      entityId: escrow.id,
      action: `STATE_CHANGE:${event.fromState}→${event.toState}`,
      actorId: event.actorId,
      metadata: { amount: escrow.amount },
    });

    return { newStatus: escrow.status, event };
  }

  private async executeSideEffects(
    escrow: EscrowTransaction,
    event: StateChangeEvent,
  ): Promise<void> {
    switch (`${event.fromState}→${event.toState}`) {
      case 'INITIATED→FUNDED_IN_ESCROW':
        await this.walletService.freezeForEscrow(escrow.buyerId, escrow.amount);
        break;

      case 'INSPECTION_PERIOD→RELEASED':
        await this.walletService.releaseToSeller(escrow.sellerId, escrow.amount);
        await this.trustScoreService.recordCompletion(escrow.buyerId, escrow.sellerId);
        break;

      case 'DISPUTED→REFUNDED':
        await this.walletService.refundToBuyer(escrow.buyerId, escrow.amount);
        await this.trustScoreService.recordDisputeLoss(escrow.sellerId);
        break;

      // ... other transitions
    }
  }
}
```

---

## 5. Auto-Release Timer Pattern

When an inspection period starts, schedule a delayed job to auto-release
funds if the buyer doesn't act within the window.

```typescript
// Schedule when entering INSPECTION_PERIOD
await this.queueService.addDelayedJob(
  'auto-release',
  {
    escrowTransactionId: escrow.id,
    scheduledAt: new Date().toISOString(),
  },
  {
    delay: escrow.inspectionWindowMs, // e.g., 48 hours = 172800000ms
    jobId: `auto-release:${escrow.id}`, // Prevents duplicate scheduling
  },
);

// Worker processes the auto-release
async processAutoRelease(jobData: AutoReleaseJobData): Promise<void> {
  const escrow = await this.escrowRepo.findById(jobData.escrowTransactionId);

  // Guard: Only release if still in INSPECTION_PERIOD
  if (!escrow || escrow.status !== 'INSPECTION_PERIOD') {
    return; // Already handled (approved, disputed, or cancelled)
  }

  // Guard: Verify the deadline has actually passed
  if (!escrow.isInspectionExpired()) {
    return; // Not yet expired — shouldn't happen but defensive
  }

  // Execute the auto-release
  const transitionUseCase = new TransitionEscrowState(
    this.escrowRepo,
    this.walletService,
    this.auditLogger,
  );

  await transitionUseCase.execute({
    transactionId: escrow.id,
    targetState: 'RELEASED',
    actor: 'SYSTEM_TIMER',
  });
}
```

---

## 6. Dispute Flow

Disputes are a special sub-flow within the escrow lifecycle.

### Dispute Resolution Tiers

```typescript
export const DisputeResolutionTier = {
  /** AI-mediated automatic resolution */
  TIER_1_AI: 'TIER_1_AI',
  /** Human mediator review */
  TIER_2_MEDIATOR: 'TIER_2_MEDIATOR',
  /** Panel review for high-value disputes */
  TIER_3_PANEL: 'TIER_3_PANEL',
} as const;
```

### Dispute Rules

1. Only the **buyer** can file a dispute during `INSPECTION_PERIOD`
2. Filing a dispute requires a **5% dispute deposit** from the buyer
3. The dispute deposit is returned if the buyer wins, forfeited if they lose
4. Evidence must be uploaded before the dispute can be escalated
5. If neither party responds within 7 days, auto-resolve in buyer's favor

---

## 7. Vertical-Specific Extensions

### Digital Goods Escrow
- Inspection window: **48 hours** (default)
- Auto-release: After inspection window expires
- AI verification: Credential checker runs during DELIVERED state

### Freelance Milestone Escrow
- Inspection window: **14 days** (client review)
- Quality gate: AI code review runs before inspection starts
- Max revision rounds: **3** (then auto-approve or escalate)

### Gaming Wager Escrow
- No inspection window — dual consensus replaces it
- **30-minute** response timer for result reporting
- If results disagree → auto-escalate to dispute
- Unresponsive opponent → auto-win for reporter after 30 minutes

---

## 8. Testing State Machines

### Test EVERY Valid Transition

```typescript
describe('EscrowTransaction', () => {
  const TRANSITIONS = [
    ['INITIATED', 'FUNDED_IN_ESCROW'],
    ['INITIATED', 'CANCELLED'],
    ['FUNDED_IN_ESCROW', 'DELIVERED'],
    ['DELIVERED', 'INSPECTION_PERIOD'],
    ['INSPECTION_PERIOD', 'RELEASED'],
    ['INSPECTION_PERIOD', 'DISPUTED'],
    ['DISPUTED', 'RELEASED'],
    ['DISPUTED', 'REFUNDED'],
  ] as const;

  it.each(TRANSITIONS)(
    'should allow transition from %s to %s',
    (from, to) => {
      const escrow = createTestEscrow({ status: from });
      expect(() => escrow.transition(to, 'test-user')).not.toThrow();
      expect(escrow.status).toBe(to);
    },
  );
});
```

### Test EVERY Invalid Transition

```typescript
const INVALID_TRANSITIONS = [
  ['INITIATED', 'RELEASED'],
  ['INITIATED', 'DISPUTED'],
  ['RELEASED', 'FUNDED_IN_ESCROW'],
  ['REFUNDED', 'RELEASED'],
  ['CANCELLED', 'INITIATED'],
] as const;

it.each(INVALID_TRANSITIONS)(
  'should reject transition from %s to %s',
  (from, to) => {
    const escrow = createTestEscrow({ status: from });
    expect(() => escrow.transition(to, 'test-user'))
      .toThrow(IllegalStateTransitionError);
  },
);
```

### Test Concurrency Safety

```typescript
it('should throw ConcurrencyError on stale version', async () => {
  // Simulate two concurrent saves
  const escrow1 = await repo.findById('e1');
  const escrow2 = await repo.findById('e1'); // Same entity, same version

  escrow1.transition('FUNDED_IN_ESCROW', 'user-1');
  await repo.save(escrow1); // Succeeds, version now 2

  escrow2.transition('CANCELLED', 'user-2');
  await expect(repo.save(escrow2)).rejects.toThrow(ConcurrencyError);
});
```

---

## Checklist — Apply Before Every Escrow Module

- [ ] State transition goes through `assertValidTransition()` — never set status directly
- [ ] Optimistic locking version check on every save
- [ ] Audit event emitted for every state change with from/to/actor/timestamp
- [ ] Side effects (wallet freeze/release) execute in the same use case
- [ ] Auto-release timer uses a unique jobId to prevent duplicates
- [ ] Worker guards check current state before acting (idempotent processing)
- [ ] All valid transitions tested
- [ ] All invalid transitions tested (expect throw)
- [ ] Terminal states (RELEASED, REFUNDED, CANCELLED) have zero valid outgoing transitions
- [ ] Dispute deposit logic enforced for dispute filing
