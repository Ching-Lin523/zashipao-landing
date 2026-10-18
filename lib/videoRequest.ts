import { browserAuth } from '@/lib/supabase/browser';
export async function videoRequest(sessionId: string, action: 'join' | 'check' | 'finish', signal?: AbortSignal) {
  const { data: { session } } = await browserAuth().auth.getSession();
  if (!session) throw new Error('AUTH_REQUIRED');
  const response = await fetch('/api/video', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ sessionId, action }), cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'VIDEO_UNAVAILABLE');
  return data;
}
