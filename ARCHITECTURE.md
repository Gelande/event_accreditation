# Architecture — Star Experience Check-in

## System context

```text
Staff phones (3)
      |
      | HTTPS
      v
React + Vite SPA
Vercel
      |
      | supabase-js
      v
Supabase
  - Auth
  - PostgreSQL
  - RPC functions
  - Realtime
  - RLS
```

There is no custom application server in V1.

## Architectural principles
1. Simplicity first.
2. PostgreSQL is the source of truth.
3. The browser may read authorized data, but business-critical writes are mediated by database functions.
4. RLS protects data even if the client is modified.
5. Realtime is a synchronization aid, not the authority for correctness.
6. Database constraints resolve race conditions.
7. No offline writes in V1.

## Data model

### `participants`
- `id uuid primary key`
- `name text not null`
- `email text null`
- `document_id text null`
- `created_at timestamptz not null default now()`

Authenticated staff:
- SELECT: allowed
- INSERT: denied
- UPDATE: denied
- DELETE: denied

### `checkins`
- `id uuid primary key`
- `participant_id uuid not null references participants(id)`
- `checked_in_at timestamptz not null`
- `checked_in_by uuid not null`
- `undone_at timestamptz null`
- `undone_by uuid null`
- `created_at timestamptz not null default now()`

A partial unique index enforces one active check-in:
`unique(participant_id) where undone_at is null`.

Historical rows are never deleted by the application.

## Write API

The browser must not directly INSERT/UPDATE/DELETE `checkins`.

Use PostgreSQL functions exposed through Supabase RPC:

### `check_in(p_participant_id uuid)`
Responsibilities:
- Require an authenticated user.
- Validate participant exists.
- Insert a new active check-in.
- Set `checked_in_at` on the server.
- Set `checked_in_by = auth.uid()`.
- Let the partial unique index reject simultaneous duplicate active check-ins.
- Return the created/current check-in information needed by the UI.

### `undo_check_in(p_participant_id uuid)`
Responsibilities:
- Require an authenticated user.
- Find the current active check-in.
- Set `undone_at` on the server.
- Set `undone_by = auth.uid()`.
- Never delete the record.
- Return a deterministic result when no active check-in exists.

This keeps the frontend simple while protecting immutable historical fields.

## Read model
On authenticated app start:
1. Fetch participants.
2. Fetch active check-ins.
3. Build a client-side map keyed by `participant_id`.
4. Subscribe to relevant `checkins` changes via Realtime.
5. Reconcile local state from database events.
6. On reconnect, refetch active check-ins.

For ~200 participants, search is performed locally in the browser.

## Search normalization
Search against:
- `name`
- `email`
- `document_id`

Normalize:
- lowercase
- trim whitespace
- optionally remove diacritics for name matching

Do not send a database query on every keystroke.

## Authentication
Supabase Auth email/password accounts are provisioned before the event.
No self-signup UI is required.

## Security
- Only the public anon key is allowed in the browser.
- RLS is enabled on exposed tables.
- Service-role key must never be shipped to Vercel client code.
- Participant data is inaccessible anonymously.
- RPC functions must derive operator identity from `auth.uid()`, never from a caller-supplied user ID.

## Realtime
Subscribe to `checkins` changes required to synchronize devices.
Realtime is not relied upon for uniqueness or correctness.
The database constraint is authoritative.

## Connectivity
V1 has no offline queue.
When connectivity to the server is unavailable:
- browsing already-loaded data may remain visible;
- check-in and undo actions are disabled;
- reconnect triggers a fresh synchronization.

## Deployment
- Git repository -> Vercel.
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Supabase migrations are stored in the repository.
- Database changes must be reproducible from migrations, not only performed manually in the dashboard.

## Deliberately excluded
- Custom API server
- Redux
- Redis
- Elasticsearch
- GraphQL
- Multi-event tenancy
- Ticket sales
- QR code workflows
- Offline conflict resolution
- Participant CRUD UI
