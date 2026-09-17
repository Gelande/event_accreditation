# Database Verification Guide

This document describes how the database model, Row Level Security (RLS) policies, and RPC functions implement and enforce the requirements in `SPEC-002`, `SPEC-004`, and `ARCHITECTURE.md`.

## Applied Migration

The initial database migration is located at:
`supabase/migrations/20260917000001_create_participants_and_checkins.sql`

It establishes:
1. `participants` table: UUID PK (`gen_random_uuid()`), `name`, `email`, `document_id`, `created_at`.
2. `checkins` table: UUID PK (`gen_random_uuid()`), `participant_id` FK, `checked_in_at`, `checked_in_by`, `undone_at`, `undone_by`, `created_at`.
3. Partial unique index on active check-ins:
   ```sql
   CREATE UNIQUE INDEX checkins_active_participant_idx
     ON public.checkins (participant_id)
     WHERE undone_at IS NULL;
   ```
4. Row Level Security (RLS) on both tables:
   - SELECT permitted only for `authenticated` staff.
   - All access denied to `anon`.
   - Direct `INSERT`, `UPDATE`, `DELETE` revoked from `authenticated` and `anon`.
5. RPC functions with `SECURITY DEFINER` and restricted execution privileges:
   - `check_in(p_participant_id uuid)`
   - `undo_check_in(p_participant_id uuid)`
6. Realtime publication:
   - Added `checkins` table to `supabase_realtime` publication.
   - Configured `REPLICA IDENTITY FULL` on `checkins`.

---

## Running Verification

### Option A: Supabase SQL Editor (Hosted Project)
1. Open your project at [app.supabase.com](https://app.supabase.com).
2. Go to **SQL Editor**.
3. Open or paste the contents of `supabase/migrations/20260917000001_create_participants_and_checkins.sql` and run it.
4. Open or paste `supabase/verify.sql` and click **Run**.
5. Inspect the output messages in the Results console. It will report all 10 invariant tests passing:
   - Test 1: Tables exist.
   - Test 2: RLS enabled on both tables.
   - Test 3: Partial unique index exists.
   - Test 4: Test participant created.
   - Test 5: `check_in` rejects unauthenticated caller.
   - Test 6: `check_in` succeeds and attributes operator from `auth.uid()`.
   - Test 7: Duplicate active `check_in` rejected deterministically (`ALREADY_CHECKED_IN`).
   - Test 8: `undo_check_in` succeeds, preserves history (`undone_at` & `undone_by` filled), attributes operator.
   - Test 9: `undo_check_in` deterministically raises `NO_ACTIVE_CHECKIN`.
   - Test 10: Re-checking in creates a second historical row with 1 active record.

### Option B: Local Supabase CLI
```bash
# Start local supabase
npx supabase start

# Apply migrations
npx supabase migration up

# Execute verification script
npx supabase db execute --file supabase/verify.sql
```

### Option C: Direct psql
```bash
psql "$DATABASE_URL" -f supabase/migrations/20260917000001_create_participants_and_checkins.sql
psql "$DATABASE_URL" -f supabase/verify.sql
```

---

## Invariants Checklist

| Invariant | Database Mechanism | Verified in `verify.sql` |
|---|---|---|
| Single active check-in per participant | Partial unique index `checkins_active_participant_idx` | Test 3, 7 |
| Participant reference integrity | FK `references public.participants(id) on delete restrict` | Migration constraint |
| Server-generated timestamps | `now()` generated inside RPC functions | Test 6, 8 |
| Operator attribution | `auth.uid()` bound to `checked_in_by` and `undone_by` | Test 6, 8 |
| History preservation (no hard delete) | `undo_check_in` performs `UPDATE`, history rows remain | Test 8, 10 |
| Anonymous data isolation | RLS + `REVOKE ALL FROM anon, public` | Test 2, 5 |
| Client cannot mutate table directly | `REVOKE INSERT, UPDATE, DELETE FROM authenticated` | Migration grants |
| Deterministic RPC error handling | Custom exceptions (`UNAUTHORIZED`, `PARTICIPANT_NOT_FOUND`, `ALREADY_CHECKED_IN`, `NO_ACTIVE_CHECKIN`) | Test 5, 7, 9 |
| Realtime synchronization capability | `REPLICA IDENTITY FULL` + `ALTER PUBLICATION supabase_realtime ADD TABLE checkins` | Migration SQL |
