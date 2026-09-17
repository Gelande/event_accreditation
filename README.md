# Star Experience Check-in

Mobile-first event reception check-in app.

## Architecture
React + Vite + TypeScript on Vercel, backed by Supabase Auth/PostgreSQL/Realtime.

Read:
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/`
- `docs/exec-plans/active/PLAN-001-v1.md`

## Codex execution order
Give Codex one task at a time, in order:

1. `docs/tasks/TASK-001-bootstrap.md`
2. `docs/tasks/TASK-002-database.md`
3. `docs/tasks/TASK-003-auth-and-read.md`
4. `docs/tasks/TASK-004-mobile-ui.md`
5. `docs/tasks/TASK-005-mutations.md`
6. `docs/tasks/TASK-006-realtime-connectivity.md`
7. `docs/tasks/TASK-007-verification.md`

Do not ask an agent to implement the entire product in one unbounded task.

## Suggested task prompt
“Implement `docs/tasks/TASK-00X-....md`. Read and follow `AGENTS.md` and all referenced specs. Stay within scope. Run all required quality checks before finishing, and report files changed, tests run, and any remaining verification gaps.”

## Local Setup

### Prerequisites
- Node.js (v20+ or v22+)
- npm

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

### Available Scripts
- `npm run dev`: Start local development server with Vite
- `npm run lint`: Check code with ESLint
- `npm run typecheck`: Run strict TypeScript compiler verification without emitting files
- `npm run test`: Run tests with Vitest and React Testing Library
- `npm run build`: Compile TypeScript and build production bundle
