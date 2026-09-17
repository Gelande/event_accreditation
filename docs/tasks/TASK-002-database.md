# TASK-002 — Supabase schema, security and RPC

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Implement the database model and invariants from SPEC-002/004 as versioned Supabase migration SQL.

## Required work
- Create `participants`.
- Create `checkins`.
- Add UUID defaults as appropriate.
- Add FK and timestamps.
- Add partial unique index for one active check-in.
- Enable RLS.
- Authenticated staff may read required rows.
- Anonymous users cannot read participant/check-in data.
- Browser roles cannot directly mutate participant data.
- Browser roles cannot directly mutate check-in history.
- Implement RPC `check_in(uuid)`.
- Implement RPC `undo_check_in(uuid)`.
- RPCs derive operator from `auth.uid()`.
- Protect immutable audit fields.
- Grant only required execution privileges.
- Include deterministic handling for duplicate active check-in and no-active-check-in cases.
- Document database verification steps.

## Acceptance
Database itself enforces the business invariants; correctness does not depend on React.
