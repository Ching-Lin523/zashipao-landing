import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { cleanupVideoRooms } from '@/lib/videoCleanup';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: NextRequest) {
  const secret = process.env.VIDEO_CLEANUP_SECRET;
  if (!secret) return reply({ error: 'NOT_CONFIGURED' }, 503);
  const expected = Buffer.from(`Bearer ${secret}`), supplied = Buffer.from(request.headers.get('authorization') ?? '');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply({ error: 'UNAUTHORIZED' }, 401);
  const url = process.env.LIVEKIT_URL, key = process.env.LIVEKIT_API_KEY, apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !apiSecret) return reply({ error: 'NOT_CONFIGURED' }, 503);
  try {
    const result = await cleanupVideoRooms(new RoomServiceClient(url.replace(/^wss:/, 'https:'), key, apiSecret));
    return reply(result, result.failed ? 503 : 200);
  } catch { return reply({ error: 'CLEANUP_FAILED' }, 503); }
}
