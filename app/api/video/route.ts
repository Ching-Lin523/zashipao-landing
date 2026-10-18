import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function POST(request: NextRequest) {
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return reply({ error: 'AUTH_REQUIRED' }, 401);
  let input: { sessionId?: string; action?: string };
  try { input = await request.json(); } catch { return reply({ error: 'INVALID_REQUEST' }, 400); }
  if (!input || typeof input.sessionId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(input.sessionId) || !['join', 'check', 'finish'].includes(input.action ?? '')) return reply({ error: 'INVALID_REQUEST' }, 400);
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: bearer } }, auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await db.auth.getUser(bearer.slice(7));
    if (authError || !user) return reply({ error: 'AUTH_REQUIRED' }, 401);
    const url = process.env.LIVEKIT_URL, key = process.env.LIVEKIT_API_KEY, secret = process.env.LIVEKIT_API_SECRET;
    const service = url && key && secret ? new RoomServiceClient(url.replace(/^wss:/, 'https:'), key, secret) : null;
    const roomName = `session-${input.sessionId}`;
    const remove = async () => {
      if (service) await service.removeParticipant(roomName, user.id);
    };
    if (input.action === 'finish') {
      const { error } = await db.rpc('finish_my_session', { p_session_id: input.sessionId });
      if (error) return reply({ error: error.message }, 403);
      // The database result stays committed even if the media service is unavailable.
      try { await remove(); } catch { return reply({ finished: true, mediaCleanupPending: true }); }
      return reply({ finished: true });
    }
    const { data: room, error } = await db.rpc('get_session_room', { p_session_id: input.sessionId });
    if (error || !room) return reply({ error: error?.message ?? 'ROOM_UNAVAILABLE' }, 403);
    if (room.finished_at || Date.parse(room.server_time) >= Date.parse(room.ends_at)) {
      try { await remove(); } catch { /* Client also disconnects immediately. */ }
      return reply({ error: 'SESSION_ENDED' }, 403);
    }
    if (input.action === 'check') return reply({ allowed: true });
    if (!service || !url || !key || !secret) return reply({ error: 'VIDEO_NOT_CONFIGURED' }, 503);
    const { data: session, error: capacityError } = await db.from('sessions').select('capacity').eq('id', input.sessionId).single();
    if (capacityError || !session) return reply({ error: 'ROOM_UNAVAILABLE' }, 403);
    await service.createRoom({ name: roomName, maxParticipants: session.capacity, emptyTimeout: 60, departureTimeout: 20, metadata: JSON.stringify({ app: 'zashipao', version: 1, sessionId: input.sessionId, endsAt: room.ends_at }) });
    // Identity is authoritative and shared by all tabs for this account.
    const token = new AccessToken(key, secret, { identity: user.id, name: typeof room.display_name === 'string' && room.display_name.trim() ? room.display_name.slice(0, 24) : '夥伴', ttl: Math.max(1, Math.min(60, Math.floor((Date.parse(room.ends_at) - Date.parse(room.server_time)) / 1000))) });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: false, canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE] });
    return reply({ token: await token.toJwt(), serverUrl: url });
  } catch { return reply({ error: 'VIDEO_UNAVAILABLE' }, 503); }
}
