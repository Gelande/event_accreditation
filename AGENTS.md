# Star Experience — Repository Instructions

## Mission
Build the smallest reliable mobile-first check-in web app for the Star Experience event.

## Source of truth
Read these before changing implementation:
1. `ARCHITECTURE.md`
2. `docs/product-specs/SPEC-001.md`
3. `docs/product-specs/SPEC-002.md`
4. `docs/product-specs/SPEC-003.md`
5. `docs/product-specs/SPEC-004.md`
6. The active execution plan under `docs/exec-plans/active/`

If code and specs disagree, stop and align the code to the approved specs. Do not silently expand scope.

## Core constraints
- Frontend: React + Vite + TypeScript.
- Hosting: Vercel.
- Backend platform: Supabase.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- Realtime: Supabase Realtime / Postgres Changes.
- Styling: Tailwind CSS.
- No custom Node/Express backend.
- No Redux.
- No GraphQL.
- No offline-first synchronization.
- No participant editing in the app.
- Participants are read-only to authenticated staff.
- Check-in writes must go through database RPC functions.
- Never expose the Supabase service-role key to the browser.

## Product rules
- Approx. 200 participants.
- Approx. 3 simultaneous staff devices.
- Search by name, email, or document/NIF.
- `participants.id` is the internal UUID.
- `document_id` is optional and is never a primary key.
- A participant may have historical check-ins but only one active check-in at a time.
- Undo never deletes history.
- Any authenticated staff user may undo an active check-in.
- Realtime must update other devices.
- Without server connectivity, check-in actions are disabled.

## Engineering rules
- TypeScript strict mode.
- Prefer small, explicit modules over abstraction layers.
- Avoid dependencies unless they remove more complexity than they add.
- Do not add features outside the specs.
- Keep business invariants in PostgreSQL, not only in React.
- User-facing errors must be understandable; do not display raw database errors.
- All timestamps are stored as `timestamptz`.
- Never log passwords, tokens, document IDs, or participant email addresses in production logs.

## Expected commands
The repository should provide:
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Before completing a coding task, run:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`

If a command cannot run because infrastructure credentials are unavailable, document exactly what was and was not verified.

## Git / task discipline
- Work only on the requested task.
- Do not rewrite unrelated files.
- Do not introduce speculative architecture.
- Keep commits focused when commits are requested by the execution environment.
- Update the execution plan when a milestone is completed.
