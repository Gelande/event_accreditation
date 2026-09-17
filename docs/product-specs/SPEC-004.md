# SPEC-004 — Technical Architecture and Project Structure

## 1. Goal
Define the implementation architecture, repository layout, module boundaries, state strategy, Supabase integration, quality gates, and deployment contract before coding.

## 2. Technology stack
- TypeScript
- React
- Vite
- Tailwind CSS
- `@supabase/supabase-js`
- Supabase Auth
- Supabase PostgreSQL
- Supabase Realtime
- PostgreSQL RPC functions for mutations
- Vercel
- Vitest
- React Testing Library
- ESLint

No custom backend is part of V1.

## 3. Dependency policy
Add a dependency only if it materially simplifies the application.

Do not add by default:
- Redux
- Zustand
- React Query
- Axios
- ORM
- component mega-framework
- form library

For this scale, React state/context plus the Supabase client is sufficient.

## 4. Proposed repository layout

```text
/
├── AGENTS.md
├── ARCHITECTURE.md
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── .env.example
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── ConnectivityBadge.tsx
│   │   ├── ParticipantCard.tsx
│   │   ├── SearchInput.tsx
│   │   └── StatsBar.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── useSession.ts
│   │   └── checkin/
│   │       ├── CheckInPage.tsx
│   │       ├── checkinApi.ts
│   │       ├── checkinTypes.ts
│   │       ├── search.ts
│   │       └── useCheckInData.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── styles/
│   │   └── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
└── docs/
    ├── product-specs/
    ├── exec-plans/
    └── tasks/
```

The exact file count may be reduced if implementation proves simpler. Avoid “architecture astronautics”.

## 5. Frontend responsibilities
Frontend may:
- authenticate;
- fetch authorized participant/check-in data;
- filter/search locally;
- call approved RPC functions;
- reflect processing/success/error state;
- subscribe to Realtime;
- refetch on reconnect.

Frontend must not:
- decide uniqueness;
- generate authoritative check-in timestamps;
- choose `checked_in_by`/`undone_by`;
- directly mutate participant data;
- directly delete check-in history;
- use a service-role key.

## 6. Supabase client
Create one browser client in `src/lib/supabase.ts`.

Required client environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`.env.example` contains names only, no secrets.

## 7. Database write contract
### `check_in(p_participant_id uuid)`
Called from `checkinApi.ts`.

Expected outcomes:
- success + active check-in data;
- participant not found;
- already checked in;
- unauthorized;
- unexpected error.

### `undo_check_in(p_participant_id uuid)`
Expected outcomes:
- success;
- no active check-in;
- unauthorized;
- unexpected error.

Raw PostgreSQL/Supabase error text must be mapped to stable application errors.

## 8. Database security
- RLS enabled.
- Anonymous SELECT denied.
- Authenticated SELECT permitted as required.
- Direct participant mutation denied.
- Direct check-in mutation denied to browser roles; mutation occurs through approved RPC functions.
- RPC functions derive staff identity from `auth.uid()`.
- Partial unique index prevents multiple active check-ins.
- Migrations must include policies, functions, constraints and indexes.

## 9. Authentication strategy
Use Supabase Auth email/password.
No public sign-up page.
Session state gates the main application.
Logout clears the session and returns to login.

## 10. State strategy
Keep state local and explicit:
- session state;
- participants array;
- active check-in map;
- loading/error state;
- search query;
- connectivity state.

No global state library is required.

Recommended derived state:
- total = participants.length
- checkedIn = active check-in map size
- pending = total - checkedIn
- search results = filtered participants

## 11. Realtime strategy
Subscribe to `checkins` changes after initial data load.

On relevant event:
- update local active-check-in map when unambiguous;
- otherwise perform a targeted/full active check-in refetch.

Correctness must never depend solely on receiving every Realtime event.

On reconnect:
- refetch active check-ins;
- re-establish subscription if necessary.

## 12. Connectivity strategy
Browser `online/offline` events may be used for immediate UI feedback, but actual server request failures must also be treated as loss of usable connectivity.

When connectivity is not usable:
- preserve already-loaded read view;
- disable check-in;
- disable undo;
- show clear status.

No local write queue.

## 13. Search
For ~200 participants, search entirely in memory.

Normalize query and searchable fields:
- trim
- lowercase
- normalize accents/diacritics for names where practical

Search should match partial values.
Do not query Supabase per keystroke.

## 14. Routing
Keep routing minimal.
Acceptable routes:
- `/login`
- `/`

If a routing package is unnecessary, conditional rendering based on session is acceptable. Prefer the simpler implementation.

## 15. Error handling
Define stable user-facing categories:
- authentication failed;
- participant already checked in;
- no active check-in;
- connectivity unavailable;
- generic operation failed.

Do not expose raw SQL errors to staff.

## 16. Testing strategy
### Unit tests
At minimum:
- search normalization/filtering;
- active-state derivation where extracted as pure logic;
- error mapping.

### Component/integration tests
At minimum:
- login error state;
- participant not checked in -> action visible;
- checked in -> undo visible;
- processing disables duplicate action;
- undo confirmation;
- offline disables mutations.

Use mocks/fakes for Supabase in frontend tests.

### Database verification
Migration SQL must cover:
- RLS;
- foreign key;
- partial unique index;
- RPC authorization;
- operator attribution;
- undo history;
- simultaneous/duplicate active check-in rejection.

If automated database integration tests are not available in the initial environment, document manual SQL verification steps and add them to the execution plan.

## 17. Quality gates
A task that changes application code is not complete until:
- lint passes;
- TypeScript passes;
- tests pass;
- production build passes.

## 18. Accessibility and mobile
- Use semantic controls.
- Inputs must have labels.
- Buttons must be comfortably tappable.
- Visible focus states.
- Status must not rely only on color.
- Main workflow optimized for phone widths.

## 19. Performance
No special performance infrastructure is needed.
Targets:
- initial participant list feels immediate on normal event connectivity;
- local search updates immediately;
- no network request per keystroke;
- avoid unnecessary repeated full fetches during normal operation.

## 20. Deployment
Vercel deploys the Vite SPA.
Supabase database is provisioned separately via versioned migrations.

Production readiness requires:
- Vercel env vars configured;
- Supabase URL/anon key configured;
- migrations applied;
- staff accounts provisioned;
- participant CSV imported;
- 3-phone concurrency smoke test completed;
- network backup/hotspot operational.

## 21. Implementation order
1. Repository bootstrap.
2. Database migration + RLS + RPC.
3. Supabase client and auth.
4. Participant/check-in read layer.
5. Search and main mobile UI.
6. Check-in / undo mutations.
7. Realtime synchronization.
8. Connectivity behavior.
9. Tests and production checks.
10. Vercel deployment and event smoke test.

## 22. Definition of done
V1 is done when three authenticated phones can:
- see the same participant list;
- search locally;
- safely check in a participant;
- see updates across devices;
- never produce two active check-ins for one participant;
- undo without deleting history;
- recover state after reconnect;
- never edit participant registration data.
