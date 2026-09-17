# PLAN-001 — Build Star Experience V1

## Objective
Implement the approved V1 from SPEC-001 through SPEC-004 without expanding scope.

## Milestones

### M1 — Bootstrap
- Create Vite React TypeScript app.
- Add Tailwind.
- Add Supabase JS.
- Add Vitest + React Testing Library.
- Configure ESLint and strict TypeScript.
- Add required npm scripts.
- Add `.env.example`.
- Ensure blank app builds and tests.

Exit:
`lint`, `typecheck`, `test`, `build` pass.

### M2 — Database
- Add first Supabase migration.
- Create `participants`.
- Create `checkins`.
- Add FK.
- Add active-check-in partial unique index.
- Enable RLS.
- Add read policies.
- Prevent browser table mutations.
- Add `check_in` RPC.
- Add `undo_check_in` RPC.
- Add required Realtime publication/config if migration-managed.

Exit:
Schema matches SPEC-002/004 and verification SQL is documented or automated.

### M3 — Authentication
- Supabase browser client.
- Session hook.
- Login UI.
- Logout.
- Protected main app.
- Authentication error handling.

### M4 — Read/search UI
- Load participants and active check-ins.
- Local normalized search.
- Participant card.
- Counters.
- Mobile-first layout.

### M5 — Mutations
- Call `check_in`.
- Call `undo_check_in`.
- Processing states.
- Undo confirmation.
- Human-readable business errors.

### M6 — Realtime/connectivity
- Subscribe to check-in changes.
- Sync active state across devices.
- Refetch on reconnect.
- Disable writes offline/unreachable.

### M7 — Verification
- Unit/component tests required by SPEC-004.
- Full lint/typecheck/test/build.
- Manual three-device concurrency checklist.
- Deployment checklist.

## Guardrails
Do not add:
- custom backend;
- Redux/Zustand unless a new approved spec requires it;
- participant CRUD;
- offline write queue;
- QR features;
- analytics dashboard.

## Completion record
Mark milestones complete here only after their exit criteria pass.
- [x] M1 — Bootstrap (TASK-001): Vite + React + strict TypeScript + Tailwind + Supabase client + Vitest/RTL + ESLint configured; `lint`, `typecheck`, `test`, `build` all pass.
- [x] M2 — Database (TASK-002): Supabase migration with `participants`, `checkins`, FK, active check-in partial unique index, RLS policies, direct table mutation revocation, `check_in` and `undo_check_in` RPC functions with operator attribution and deterministic errors, Realtime configuration, and automated/documented verification SQL (`supabase/verify.sql`, `docs/database-verification.md`).
- [x] M3 — Authentication & read model (TASK-003): Supabase browser client, email/password login with generic error message, session restoration & auth listener in `useSession`, session gate blocking participant UI before auth, logout, `fetchParticipants` and `fetchActiveCheckIns` API functions, efficient participant ID map, `useCheckInData` hook with loading and error states, and comprehensive test coverage across components and hooks.
- [x] M4 — Mobile check-in UI & local search (TASK-004): `search.ts` with diacritic-tolerant, case-insensitive in-memory filtering; `SearchInput`, `StatsBar`, `ConnectivityBadge`, and `ParticipantCard` components; `CheckInPage` fully integrated with search, counters, and participant cards; mobile-first accessible controls; all 45 tests pass, lint/typecheck/build clean.
- [x] M5 — Mutations (TASK-005): RPC wrappers `callCheckIn` and `callUndoCheckIn` implemented with stable mapped business errors. `useCheckInActions` hook manages optimistic UI updates and processing state. `ParticipantCard` wired to mutations, with undo confirmation flow preventing accidental resets. Offline guards implemented for actions. Full unit test coverage added.
- [x] M6 — Realtime/connectivity (TASK-006): Added `useConnectivity` hook tracking `navigator.onLine` with window events. `useCheckInData` refactored to subscribe to `postgres_changes` on `checkins` table (updating state on INSERT/UPDATE/DELETE) and automatically triggering a full data refetch upon network reconnection. `App.tsx` wired to provide `isOnline` context seamlessly. 67 tests pass.
- [x] M7 — Verification (TASK-007): All automated tests implemented and passing. Checked codebase for security leaks (no service_role key exposed). Verification manual compiled and ready for deployment. Project V1 implementation complete.
