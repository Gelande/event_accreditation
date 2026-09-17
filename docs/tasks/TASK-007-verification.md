# TASK-007 — Tests, production verification and deploy readiness

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Verify V1 against the approved specs.

## Required automated checks
- Search normalization/filter tests.
- Authentication error UI test.
- Not-checked-in action state.
- Checked-in/undo state.
- Duplicate-tap processing protection.
- Undo confirmation.
- Offline mutation disabling.
- Error mapping.
- `lint`, `typecheck`, `test`, `build`.

## Manual/event checks
- Login from three phones.
- Same ~200 participant list visible.
- Simultaneous check-in of same participant produces one active check-in.
- Realtime state converges on all phones.
- Undo from a different staff account succeeds and preserves history.
- Re-check-in after undo creates a new history row.
- Disconnect one phone; mutations disable.
- Reconnect; state refetches correctly.
- Verify staff cannot edit/delete participants.
- Verify anonymous access is denied.
- Verify Vercel environment variables contain only URL + anon key.
- Verify service-role key is absent from browser/deployment client env.

## Output
Document any failed or unverified item. Do not declare production ready while critical invariants are unverified.
