# TASK-003 — Authentication and read model

## Read first
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/SPEC-001.md`
- `docs/product-specs/SPEC-002.md`
- `docs/product-specs/SPEC-003.md`
- `docs/product-specs/SPEC-004.md`
- `docs/exec-plans/active/PLAN-001-v1.md`


## Goal
Add Supabase client, login/logout, protected app session, and initial participant/active-check-in reads.

## Required work
- Single browser Supabase client.
- Login with email/password.
- Generic invalid-credentials message.
- Session restoration.
- Logout.
- Prevent participant UI before authentication.
- Fetch participants.
- Fetch active check-ins.
- Represent active check-ins efficiently by participant ID.
- Add loading and user-friendly error states.

## Acceptance
An authenticated staff user can open the app and see data; an anonymous user cannot.
