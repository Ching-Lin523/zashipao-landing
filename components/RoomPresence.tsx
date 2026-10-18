'use client';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
type Presence = { capacity: number; members: { member_id: string; label: string; is_self: boolean }[] };
export function RoomPresence({ sessionId }: { sessionId: string }) {
  const [presence, setPresence] = useState<Presence | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const client = browserAuth(), tab = crypto.randomUUID();
    let active = true, pending = false;
    const leave = () => { void client.rpc('leave_room_presence', { p_session_id: sessionId, p_tab_id: tab }).then(() => {}); };
    const heartbeat = async () => {
      if (!active || pending) return;
      pending = true;
      try {
        const { data, error } = await client.rpc('room_presence_heartbeat', { p_session_id: sessionId, p_tab_id: tab });
        if (!active) { leave(); return; }
        if (error) throw error;
        setPresence(data as Presence); setError(false);
      } catch { if (active) { setPresence(null); setError(true); } }
      finally { pending = false; }
    };
    setPresence(null); setError(false); void heartbeat();
    const timer = window.setInterval(heartbeat, 15000);
    const { data: { subscription } } = client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        active = false; clearInterval(timer); setPresence(null); setError(true);
      }
    });
    window.addEventListener('focus', heartbeat);
    window.addEventListener('pagehide', leave);
    return () => { active = false; clearInterval(timer); subscription.unsubscribe(); window.removeEventListener('focus', heartbeat); window.removeEventListener('pagehide', leave); leave(); };
  }, [sessionId, retry]);
  return <section aria-label="同房夥伴" className="my-6 rounded-xl border border-border p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="font-bold">同房夥伴</h2>{presence ? <span className="text-sm text-forest">{presence.members.length} / {presence.capacity} 人在線</span> : null}</div>
    {error ? <p role="status" className="mt-3 text-sm text-muted">暫時無法確認在線狀態。<button className="ml-2 text-terracotta underline" onClick={() => setRetry(value => value + 1)}>重試</button></p>
      : presence ? <ul className="mt-3 flex flex-wrap gap-2">{presence.members.map(member => <li key={member.member_id} className="inline-flex items-center gap-2 rounded-full bg-forest-lt px-3 py-2 text-sm text-forest"><span aria-hidden="true" className="size-2 rounded-full bg-forest" />{member.is_self ? '你' : member.label}</li>)}</ul>
      : <p role="status" className="mt-3 text-sm text-muted">正在確認在線夥伴…</p>}
    <p className="mt-3 text-xs leading-relaxed text-light">顯示本場等候區與房間的在線夥伴，每 15 秒更新。離線狀態約需 1 分鐘確認。</p>
  </section>;
}
