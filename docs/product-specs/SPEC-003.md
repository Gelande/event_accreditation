# SPEC-003 — UX and Mobile Flows

## Primary flow
Open app -> login -> search -> identify participant -> check in -> next participant.

## Screens
### Login
- Email
- Password
- Enter button
- Generic invalid-credentials error

### Main check-in screen
- Star Experience identity/header
- Connectivity status
- Single search field
- Counters: total, checked in, pending
- Search results
- Check-in state/action
- Discreet logout

## Search
One field searches locally by name, email, document/NIF, or ticket type.

## Ticket Types and Materials
- Two ticket types exist: `Star` and `Constellation`.
- Each participant card displays a high-visibility badge with their ticket type and instructions for materials to deliver:
  - Star: `Kit Star + Credencial Star`
  - Constellation: `Kit Constellation + Credencial Constellation`

## Participant states
### Not checked in
Show identity fields, ticket type / material banner, and primary `CHECK-IN` action.

### Processing
Disable repeat taps and show progress.

### Checked in
Show clear checked-in state and check-in time.
Offer secondary `UNDO CHECK-IN` action.

### Undo
Undo requires confirmation.
After success, participant returns to not-checked-in state.

## Concurrency UX
If another device checks in the participant first:
- Realtime updates the state where possible.
- If the local request loses the race, show a human-readable “already checked in” result and synchronize state.

## Connectivity
- Show Online / Offline (or equivalent).
- Do not queue writes offline.
- Disable check-in and undo while server connectivity is unavailable.
- Refetch state after reconnection.

## UX acceptance
The operator should remain on one operational screen after login and complete a normal check-in with the minimum practical number of taps.
