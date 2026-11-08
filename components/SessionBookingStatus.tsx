'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { browserAuth } from '@/lib/supabase/browser';

type Status = { loading: boolean; failed: boolean; bookings: Record<string, string> };
const Context = createContext<Status>({ loading: true, failed: false, bookings: {} });
export function SessionBookingStatus({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>({ loading: true, failed: false, bookings: {} });
  useEffect(() => {
    let generation = 0;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const token = ++generation;
      setStatus({ loading: true, failed: false, bookings: {} });
      try {
        const client = browserAuth();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (!active || token !== generation) return;
        if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
        if (!user) { setStatus({ loading: false, failed: false, bookings: {} }); return; }
        const { data, error } = await client.from('bookings').select('id,session_id').eq('user_id', user.id);
        if (!active || token !== generation) return;
        if (error) throw error;
        setStatus({ loading: false, failed: false, bookings: Object.fromEntries((data ?? []).map(row => [row.session_id, row.id])) });
      } catch { if (active && token === generation) setStatus({ loading: false, failed: true, bookings: {} }); }
    };
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange(() => {
      ++generation;
      setStatus({ loading: true, failed: false, bookings: {} });
      clearTimeout(timer);
      timer = setTimeout(() => { void load(); }, 0);
    });
    window.addEventListener('focus', load);
    window.addEventListener('zashipao-bookings-updated', load);
    return () => { active = false; ++generation; clearTimeout(timer); subscription.unsubscribe(); window.removeEventListener('focus', load); window.removeEventListener('zashipao-bookings-updated', load); };
  }, []);
  return <Context.Provider value={status}>{children}</Context.Provider>;
}
export function SessionBookingAction({ sessionId, full, tasks }: { sessionId: string; full: boolean; tasks: string }) {
  const { loading, failed, bookings } = useContext(Context);
  if (loading) return <span role="status" className="text-sm text-muted">確認預約中…</span>;
  if (failed) return <Link href="/my-sessions" className="text-sm text-terracotta underline">無法確認預約，查看我的場次</Link>;
  if (bookings[sessionId]) return <div className="flex items-center gap-3"><span className="text-sm font-bold text-forest">已預約</span><Link className="rounded-full border border-forest px-5 py-3 text-sm font-bold text-forest" href={`/my-sessions#${bookings[sessionId]}`}>查看預約</Link></div>;
  if (full) return <button disabled className="rounded-full border border-border px-5 py-2 text-muted">已額滿</button>;
  return <Link className="rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white" href={`/sessions/book?session=${sessionId}${tasks ? `&tasks=${encodeURIComponent(tasks)}` : ''}`}>預約這場次</Link>;
}
