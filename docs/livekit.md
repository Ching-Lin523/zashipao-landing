# LiveKit video setup

Set server environment variables `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in `.env.local` and in the deployment environment. Never prefix the key or secret with NEXT_PUBLIC. Restart the Next.js server after changes. HTTPS is required for camera/microphone on deployed sites (localhost works for development).

The room UI starts with audio/video capture off. Click connect, then enable individual devices. Participants join a deterministic room per session. One account uses one LiveKit identity; another tab for that account can replace its connection. No recording, screen sharing, chat, or agent is enabled.

POST /api/video verifies Supabase access tokens and the existing get_session_room RPC before issuing short-lived, room-specific tokens. No service-role database key is used. The finish action calls finish_my_session and removes that user's media participant. A failed media cleanup does not roll back the saved outcome. The browser disconnects on unmount, page exit, session end, auth changes, or failed periodic eligibility check.

## Test before deployment

Use two different accounts booked into the same active session in two browsers/devices. Confirm camera/mic toggle, remote audio/video, denied permission recovery, reconnect, early finish and natural end. Use headphones to avoid feedback. Verify unbooked and signed-out accounts cannot obtain tokens. Run `node --test tests/video-access.test.cjs` and TypeScript checks.

## Server cleanup (deployment still required)

`POST /api/video/cleanup` requires `Authorization: Bearer <VIDEO_CLEANUP_SECRET>`. Set a random server-only secret in local/deployment configuration. It enumerates LiveKit rooms and deletes only UUID-named session rooms with matching zashipao v1 metadata and expired endsAt. Failures return HTTP 503 for monitoring/retry; successful empty runs return 200. Room deletion disconnects all participants.

New join requests set metadata from the database-validated scheduled end. Existing rooms without metadata are deliberately skipped; recreate them before testing this enforcement. The cleanup uses the end captured when creating the LiveKit room. Avoid editing a live session's end time without updating its LiveKit metadata server-side. An extension does not automatically extend an already created media room.

A trusted external scheduler must POST to the deployed public HTTPS endpoint every minute with the secret. Do not put secrets in committed SQL or URLs. No scheduler has been enabled by this code change. Until deployment and scheduler configuration are verified, natural-end enforcement still relies on the supported browser UI. With a healthy once-per-minute schedule, server disconnection can occur up to about one minute after the scheduled end, plus network/runtime delay. Monitor job failures.

LiveKit token expiry restricts initial connection, not established connection duration. The scheduled room deletion is necessary for clients that suppress their own disconnect/polling. Failed early-finish media removal is still only retried by the client eligibility check or eventual room deletion; a dedicated retry queue is not implemented.
