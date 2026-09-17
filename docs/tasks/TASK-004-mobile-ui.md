# TASK-004 — Mobile check-in UI and local search

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Implement the operational mobile UI from SPEC-003 without mutations yet.

## Required work
- Main check-in screen.
- Search field.
- Local search over name, email, document ID.
- Case-insensitive matching.
- Diacritic-tolerant name matching where practical.
- Participant card.
- Checked-in/not-checked-in states.
- Total/checked-in/pending counters.
- Connectivity badge shell.
- Mobile-first accessible controls.

## Acceptance
Searching never sends a request per keystroke and works smoothly with ~200 records.
