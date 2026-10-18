# Account isolation checks — 2026-10-18

## Passed

- Applied all SQL migrations to an isolated PGlite PostgreSQL-compatible database with authenticated A/B roles and auth.uid simulation.
- B cannot select A's tasks, bookings, booking-task links, result headers or result tasks.
- B cannot update/delete A's tasks or insert a task under A's user ID.
- Unbooked B is rejected by waiting-room, room, finish and result RPCs. A can retrieve A's completed result.
- Browser authenticated role cannot read audit events; anonymous role cannot read private tables.
- Read-only checks against the configured Supabase project: tasks, bookings, booking_tasks, session_results, session_result_tasks and booking_events all returned HTTP 401 for anonymous access.
- Local app signed-out requests to /tasks, /my-sessions and a room URL returned HTTP 307 to login.
- Eight video-access/cleanup mocked tests passed.

## Code review / fix

Task store clears data and invalidates prior requests when the user changes; result and room components clear displayed data on auth events. Waiting-room auth changes now invalidate the old effect immediately, preventing late requests from restoring the previous user's data before effect cleanup.

## User verification completed

The user confirmed with two accounts that unbooked B cannot enter A's room via its URL, and that signing out of A and signing in as B leaves no A task or booking data visible.

These local browser checks are not a full production audit. Vercel runtime error and scheduler setup remain outstanding.
