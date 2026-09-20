# React Native Frontend Standards

All React Native code for the Trust, Verification & Escrow mobile application must adhere strictly to these production standards.

---

## 1. Component Architecture & Paradigms

- **Functional Components Only**: Class components are strictly prohibited. Use functional components with standard React hooks.
- **TypeScript Strict Mode**:
  - Full TypeScript strict typing for all props, navigation params, state models, and hook returns.
  - Component props must be defined with explicit `interface` or `type` contracts.
  - Avoid `any`. Use strict generic parameters and type narrowing.

---

## 2. Navigation & Routing

- **React Navigation v7**:
  - All navigation stacks, tabs, and modals must follow React Navigation v7 conventions and type definitions.
  - Screen props must be typed using `NativeStackScreenProps` or equivalent typed navigation routes.
  - Deep linking and authentication gating must be defined at the root navigation container.

---

## 3. State Management Architecture

- **Client State with Zustand**:
  - Use Zustand stores for local UI state, user session, themes, cached device state, and persistent preferences.
  - Separate state actions from state data. Keep stores small, atomic, and focused.
- **Server State with TanStack React Query**:
  - All remote data fetching, caching, invalidation, mutations, and optimistic updates must use TanStack Query (`@tanstack/react-query`).
  - Cache keys must be managed in a centralized key factory.
  - Mutations must define optimistic rollbacks and invalidate related query caches on escrow/verification status changes.

---

## 4. Styling Standards

- **`StyleSheet.create` Only**:
  - Never use inline style objects (`style={{ marginTop: 10 }}`). Inline styles cause unnecessary object allocations and defeat native optimizations.
  - All styles must be defined using `StyleSheet.create` outside the component render body.
  - Use semantic spacing, color tokens, and typography scales from design tokens.

---

## 5. Performance & Optimization

- **Memoization**:
  - Apply `React.memo` to list items, cards, and frequently re-rendered child components.
  - Use `useCallback` for callbacks passed to child components or list items.
  - Use `useMemo` for non-trivial data transformations, filtering, and sorting.
- **Lists**:
  - Use `FlashList` (`@shopify/flash-list`) instead of `FlatList` for long or dynamic transaction and verification feeds.
  - Always provide stable `keyExtractor` functions.

---

## 6. Internationalization & Localization

- **No Hardcoded Strings**:
  - User-facing text, error messages, button labels, and placeholders must never be hardcoded into JSX or components.
  - Use i18n localization translation keys (`i18next` / `t('escrow.release_funds')`) or centralized string constant dictionaries.

---

## 7. Mandatory Screen States

Every screen and data container must explicitly implement and render 3 core lifecycle states in addition to normal content:
1. **Loading State**: Skeleton loaders or branded activity spinners during initial data load.
2. **Error State**: User-friendly error message with retry action button and error boundary capture.
3. **Empty State**: Clear contextual illustration/icon, explanatory text, and primary call-to-action when data lists (e.g., transactions, disputes, pending verifications) are empty.
