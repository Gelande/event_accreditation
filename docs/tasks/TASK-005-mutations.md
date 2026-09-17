# TASK-005 — Check-in and undo actions

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Connect the UI to the approved database RPC mutation API.

## Required work
- `checkinApi.ts` wrapper for `check_in`.
- Wrapper for `undo_check_in`.
- Stable app-level error mapping.
- Processing state disables repeated taps.
- Successful check-in updates state.
- Checked-in participant shows time.
- Undo requires confirmation.
- Successful undo returns participant to not-checked-in state.
- Raw database errors are not shown.

## Acceptance
The browser never directly inserts, updates, or deletes `checkins`.
