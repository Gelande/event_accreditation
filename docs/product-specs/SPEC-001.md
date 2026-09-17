# SPEC-001 — Functional Requirements

## Goal
Allow up to three authenticated reception staff members to check in approximately 200 Star Experience participants quickly and safely from mobile phones.

## Functional requirements
- Authentication is required before participant data is shown.
- Staff can view participants.
- Staff can search by name, email, or document/NIF.
- Staff can perform a check-in.
- Staff can see whether a participant is currently checked in.
- Staff can undo an active check-in.
- Any authenticated staff user may undo a check-in, regardless of who created it.
- Staff cannot edit or delete participant registration data.
- Devices synchronize check-in state in near real time.
- A participant cannot have more than one active check-in.
- A check-in records server time and the authenticated operator.
- Undo records server time and the authenticated operator.
- Connectivity state is visible.
- Check-in/undo writes are disabled when server connectivity is unavailable.

## MVP exclusions
No public registration, payments, ticketing, QR codes, native app, multi-event management, advanced analytics, SEO, or offline-first write synchronization.
