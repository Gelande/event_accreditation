# TASK-001 — Bootstrap repository

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Create the minimal React/Vite/TypeScript project and developer toolchain specified by SPEC-004.

## Required work
- Initialize Vite React TypeScript.
- Configure strict TypeScript.
- Configure Tailwind.
- Install/configure `@supabase/supabase-js`.
- Configure Vitest + React Testing Library.
- Configure ESLint.
- Add scripts: `dev`, `lint`, `typecheck`, `test`, `build`.
- Add `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Create only the minimum folder skeleton needed for subsequent tasks.
- Add/update README with local setup commands.

## Acceptance
- No business features yet.
- No custom backend.
- No secret values committed.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
