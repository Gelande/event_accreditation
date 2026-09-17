# SPEC-002 — Data Model, Security and Integrity

## Participants
`participants`
- `id uuid primary key`
- `name text not null`
- `email text null`
- `document_id text null`
- `created_at timestamptz not null default now()`

`id` is an internal UUID. `document_id` may contain a NIF or another document value and may be null.

Authenticated staff can read participants but cannot insert, update, or delete them through the application.

## Check-ins
`checkins`
- `id uuid primary key`
- `participant_id uuid not null references participants(id)`
- `checked_in_at timestamptz not null`
- `checked_in_by uuid not null`
- `undone_at timestamptz null`
- `undone_by uuid null`
- `created_at timestamptz not null default now()`

Undo does not delete or overwrite historical check-in identity/time fields. It fills `undone_at` and `undone_by`.

A later valid arrival creates a new check-in row.

## Invariants
- Participant internal IDs are unique UUIDs.
- `document_id` is never a primary key.
- Only one active check-in may exist per participant.
- Every check-in references an existing participant.
- Active check-in means `undone_at is null`.
- Check-in and undo times are server-generated.
- Operator IDs come from the authenticated session.
- Anonymous users cannot read participant data.
- App users cannot modify participant data.
- App users cannot delete check-in history.

## Concurrency
A partial unique index on active `participant_id` resolves simultaneous attempts at the database level.

## Security refinement
Writes to `checkins` are performed through PostgreSQL RPC functions (`check_in`, `undo_check_in`) rather than direct browser table mutations. This ensures immutable columns and authenticated operator attribution are enforced by PostgreSQL.
