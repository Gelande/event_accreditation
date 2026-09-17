# TASK-006 — Realtime synchronization and connectivity

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Keep three devices synchronized without introducing offline-write complexity.

## Required work
- Subscribe to relevant check-in changes.
- Reconcile active check-in state.
- Handle race where another device wins check-in.
- Show Online/Offline state.
- Disable check-in/undo when server connectivity is unavailable.
- On reconnect, refetch authoritative active check-ins.
- Re-establish Realtime subscription when necessary.
- No offline write queue.

## Acceptance
Two or three open devices converge to the same current check-in state and a reconnect repairs missed events.
