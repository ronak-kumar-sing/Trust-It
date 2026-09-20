# Backend Architecture Rules: Clean Architecture

All backend code for the Trust, Verification & Escrow Platform must adhere strictly to Clean Architecture principles.

## Layer Responsibilities and Boundaries

Dependencies must point inward: `Presentation -> Application -> Domain` and `Infrastructure -> Application -> Domain`. The domain layer has zero external dependencies.

```text
                  +-----------------------------------+
                  |           Presentation            |
                  |     (Controllers, Routes, DTOs)   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |           Application             |
                  |     (Use Cases, Commands, Queries)|
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |             Domain                |
                  |  (Entities, Value Objects, Events)|
                  +-----------------+-----------------+
                                    ^
                                    |
                  +-----------------+-----------------+
                  |          Infrastructure           |
                  | (DB, Payment Gateways, KYC, APIs) |
                  +-----------------------------------+
```

### 1. Domain Layer (`src/domain/`)
- **Entities**: Business objects with unique identity and lifecycle (e.g., `EscrowTransaction`, `VerificationRequest`, `Dispute`).
- **Value Objects**: Immutable objects defined solely by their attributes (e.g., `Money`, `EscrowStatus`, `VerificationScore`, `IdempotencyKey`).
- **Domain Events**: Events signaling significant domain occurrences (e.g., `EscrowFundsLockedEvent`, `VerificationCompletedEvent`, `DisputeRaisedEvent`).
- **Invariants**: All business validation and state transition rules must be encapsulated inside entities and value objects.
- **Rules**:
  - No dependencies on frameworks, databases, libraries, or external systems.
  - Zero imports from `infrastructure/` or `presentation/`.

### 2. Application Layer (`src/application/`)
- **Use Cases / Interactors**: Orchestrate business flows (e.g., `CreateEscrowUseCase`, `ReleaseFundsUseCase`, `VerifyIdentityUseCase`).
- **DTOs (Data Transfer Objects)**: Strictly typed request/response data structures passing across boundaries.
- **Interfaces / Ports**: Abstract contracts for repositories, external escrow/payment providers, notification gateways, and audit loggers.
- **Rules**:
  - Only depend on `src/domain/`.
  - Never instantiate concrete infrastructure implementations directly; use dependency injection.

### 3. Infrastructure Layer (`src/infrastructure/`)
- **Database & Repositories**: Concrete implementations of repository interfaces (e.g., PostgreSQL, Prisma, Drizzle, Redis).
- **External Services**: Integrations with payment gateways (Stripe, escrow rails), KYC/identity verification providers, webhook dispatchers.
- **Frameworks & Config**: Configuration, logging, cryptographic signing, hashing, and telemetry.
- **Rules**:
  - Implements interfaces defined in `src/application/`.

### 4. Presentation Layer (`src/presentation/`)
- **Controllers & Handlers**: HTTP / WebSocket / RPC request handlers.
- **Routes & Middleware**: Route definitions, authentication/authorization checks, rate limiting, request validation.
- **Rules**:
  - Call application use cases; never access domain entities or repositories directly.
  - Translate domain/application errors into appropriate HTTP responses.

---

## Code Quality and Enforcement Requirements

1. **TypeScript Strict Mode**:
   - Every file must run under TypeScript strict mode (`"strict": true` in `tsconfig.json`).
   - No `any` types allowed without explicit justification; use `unknown` and type guards instead.
2. **JSDoc Documentation**:
   - Every exported function, class, interface, method, and domain entity must have comprehensive JSDoc comments detailing purpose, parameters, return types, and potential exceptions thrown.
3. **Unit Testing Coverage**:
   - Every module must have accompanying unit tests (`*.spec.ts` or `*.test.ts`) written with Vitest.
   - Domain logic and application use cases must have 100% branch test coverage.
