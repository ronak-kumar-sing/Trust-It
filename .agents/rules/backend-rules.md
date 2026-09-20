# Backend Development Rules — Trust Platform API

These rules are ALWAYS active for any backend code in `trust-platform-backend/`.
Every file MUST comply. No exceptions.

---

## Architecture Rules

### 1. Clean Architecture Layer Imports (HARD RULE)
- `domain/` imports NOTHING external — zero npm packages, zero framework imports
- `application/` imports ONLY from `domain/` and `shared/`
- `infrastructure/` imports from `domain/`, `application/`, and `shared/`
- `presentation/` imports from `domain/`, `application/`, and `shared/` — NEVER directly from `infrastructure/`
- Infrastructure is injected into presentation via Fastify plugins (dependency inversion)

### 2. No Business Logic in Routes or Controllers
- Controllers extract validated input, call a use case, return the result
- All business rules live in domain entities or application use cases
- Controllers are thin wrappers — max 10 lines of logic

### 3. Every Use Case Is a Single Class
- One public `execute()` method
- Dependencies injected via constructor
- Returns a typed result DTO, never raw database rows

---

## TypeScript Rules

### 4. Strict Mode — Non-Negotiable
- `"strict": true` in tsconfig.json
- Zero `any` types — use `unknown` + Zod validation instead
- Zero non-null assertions (`!`) without a preceding guard clause
- Zero type assertions (`as`) without preceding validation
- All function parameters and return types must be explicitly typed

### 5. JSDoc on Every Export
- Every exported function, class, interface, enum, and method MUST have JSDoc
- JSDoc MUST include: purpose, `@param`, `@returns`, and `@throws` (where applicable)
- Internal/private methods: JSDoc optional but encouraged

---

## Financial Safety Rules

### 6. Escrow State Transitions Are Law
- ALL state transitions go through `assertValidTransition()` from the transition table
- NEVER set status directly on an entity — always use the `transition()` method
- Every transition emits a `StateChangeEvent` for the audit trail

### 7. Optimistic Locking on Financial Writes
- Every `UPDATE` on `escrow_transactions`, `wallets`, `milestones` MUST include a `WHERE version = ?` check
- On version mismatch, throw `ConcurrencyError` — never silently proceed
- Version is incremented by the domain entity, never by the repository

### 8. Idempotency-Key on All Mutations
- Every `POST`/`PUT`/`PATCH` endpoint that modifies financial state MUST require an `Idempotency-Key` header
- Missing key = 400 Bad Request
- Duplicate key = return cached response (same status + body)

### 9. Audit Trail — Every Financial Change
- Every wallet balance change emits an audit event (entity, entityId, action, actorId, amount, timestamp)
- Every escrow state transition emits an audit event (fromState, toState, actorId)
- Every trust score change emits an audit event
- Audit records are INSERT-only — never updated or deleted

### 10. Money as Integers
- ALL monetary values stored and transmitted as **integers in paise** (₹1 = 100 paise)
- Never use floating point for money — use the `Money` value object
- Display formatting (₹XX.XX) happens ONLY in the presentation layer

---

## API Rules

### 11. Consistent Response Shape
```typescript
// Success
{ "data": { ... }, "meta": { "timestamp": "...", "requestId": "..." } }

// Error
{ "error": { "code": "ERROR_CODE", "message": "Human message" }, "meta": { ... } }
```

### 12. API Versioning
- All routes prefixed with `/api/v1/`
- No breaking changes within a version

### 13. Request Validation
- Every request body validated with Zod schemas BEFORE the controller
- Invalid input = 400 with specific field errors
- Never trust client input — validate everything server-side

---

## Testing Rules

### 14. Every Module Has Tests
- Unit tests for every use case (mock repositories, mock external services)
- Unit tests for every domain entity (test invariants, state transitions)
- Integration tests for critical API flows using `fastify.inject()`
- Minimum 80% code coverage target

### 15. Test File Naming
- Unit tests: `tests/unit/` mirroring `src/` structure, e.g., `tests/unit/application/use-cases/wallet/FreezeForEscrow.spec.ts`
- Integration tests: `tests/integration/`, e.g., `tests/integration/wallet.spec.ts`

### 16. Test Independence
- Every test is self-contained — no shared mutable state between tests
- Use `beforeEach` to reset mocks
- Never depend on test execution order

---

## Logging Rules

### 17. Structured Logging via Pino
- Use Fastify's built-in Pino logger — never `console.log` in production code
- Log levels: `error` for unrecoverable, `warn` for degraded, `info` for business events, `debug` for troubleshooting
- Include `requestId`, `userId`, `transactionId` in log context
- Never log sensitive data: passwords, tokens, full card numbers, PII

---

## Dependency Rules

### 18. Free Tier Only
- Supabase: Free tier (500MB DB, 50K MAU)
- Redis: Upstash free tier (10K commands/day) or local Docker
- Razorpay: Test mode only for development
- Firebase: Free tier (Spark plan)
- No paid dependencies without explicit approval
