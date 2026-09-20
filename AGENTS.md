# Project Rules: Trust, Verification & Escrow Platform

Welcome to the Trust, Verification & Escrow Platform codebase. All development and AI agent pair programming must follow these established architectural rules and coding standards.

---

## 1. Backend Architecture: Clean Architecture

All backend modules must strictly adhere to Clean Architecture:

- **`src/domain/`**: Enterprise business entities, value objects, domain events, and state invariants. Zero external dependencies.
- **`src/application/`**: Business use cases, DTOs, repository interfaces, and port contracts. Dependent only on `domain`.
- **`src/infrastructure/`**: Database implementations (PostgreSQL/Prisma/Drizzle), external escrow/payment APIs, KYC providers, cryptography, logging.
- **`src/presentation/`**: HTTP/WebSocket controllers, Express/Fastify routes, validation middleware, and DTO serializers.

### Backend Code Quality Requirements
- **TypeScript Strict Mode**: Every file must compile under TypeScript strict mode (`"strict": true`). No untyped `any`.
- **JSDoc Comments**: Every exported function, class, interface, and method must have comprehensive JSDoc documentation describing purpose, arguments, return values, and thrown errors.
- **Unit Testing**: Every module must have accompanying unit tests (`*.spec.ts` / `*.test.ts`) written with Vitest.

---

## 2. Frontend Standards: React Native

All mobile application code must strictly follow these React Native standards:

- **Functional Components Only**: Class components are prohibited.
- **TypeScript Strict Mode**: Fully typed props, navigation routes, and state payloads.
- **Navigation**: React Navigation v7 for all stack, tab, and modal navigation structures.
- **Client State**: Zustand for local UI, session, and device state.
- **Server State**: TanStack React Query for all asynchronous API fetching, mutations, and caching.
- **Styling**: `StyleSheet.create` for all styles. Inline styles are strictly forbidden.
- **Performance**: Judicious memoization with `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders. Use `FlashList` for lists.
- **Internationalization**: No hardcoded strings. All user-facing text must use constants or i18n localization keys.
- **Screen States**: Every screen must explicitly handle and display **Loading**, **Error** (with retry action), and **Empty** states.

---

## 3. Financial & Escrow Platform Integrity

- **State Machine Rigor**: Escrow transactions must transition strictly through deterministic states: `INITIATED -> FUNDED_IN_ESCROW -> INSPECTION_PERIOD -> (DISPUTED) -> RELEASED / REFUNDED`.
- **Idempotency**: All mutation endpoints (payment locks, fund releases, dispute creations) must require and enforce unique `Idempotency-Key` headers.
- **Audit Trails**: Every verification status transition and financial balance adjustment must emit tamper-evident audit log events.

---

## 4. Installed Specialized Skills

The following 16 specialized agent skills are active in `.agents/skills/`:

### Backend & Architecture
- `fastify-clean-architecture`: Production Fastify + TypeScript + Supabase + BullMQ patterns, Clean Architecture layering, Zod validation, idempotency, structured logging.
- `escrow-state-machine`: Deterministic escrow state machine patterns, optimistic locking, audit trails, auto-release timers, dispute flows.
- `best-practices`: Security, OWASP guidelines, defensiveness, modern Node.js standards.
- `thermo-nuclear-code-quality-review`: Ultra-strict code maintainability and complexity auditing.
- `vitest`: Testing best practices, mocking, fixtures, coverage analysis.

### React Native & Mobile
- `react-native-best-practices`: RN performance (FPS, TTI, Hermes, re-renders, memory leaks).
- `apple-design`: Apple Human Interface Guidelines (HIG) compliance and design craft.
- `baseline-ui`: Fast UI deslopping, spacing, hierarchy, and polish.
- `accessibility`: WCAG 2.2 accessibility compliance, screen readers, touch targets.
- `performance`: Runtime, asset, and network speed optimization.

### UI & Product Design
- `frontend-design`: High-craft, distinctive, production-grade interface design.
- `interface-design`: Specialized UI patterns for SaaS dashboards, escrow trackers, and admin panels.
- `ui-skills-root`: Contextual skill selector across UI topics.
- `design-lab`: Interactive design exploration and prototyping.

### Quality & Auditing
- `audit-and-fix`: Full WCAG 2.2 accessibility auditing and remediation.
- `web-quality-audit`: Lighthouse-style multi-pillar web quality evaluation.
