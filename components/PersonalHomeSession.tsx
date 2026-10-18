'use client';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { HomeSessionCard, type HomeSessionCardProps } from './HomeSessionCard';
import { ButtonLink } from './ButtonLink';
type Reservation = {
  session_results: { finished_at?: string | null } | null;
  id: string; session_id: string;
  sessions: { title: string; starts_at: string; ends_at: string; capacity: number };
  booking_tasks: { tasks: { title: string; completed: boolean } | null }[];
};
export function PersonalHomeSession(props: HomeSessionCardProps) {
  const [member, setMember] = useState<HomeSessionCardProps['member']>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true, version = 0;
    let userId: string | null = null;
    const client = browserAuth();
    const refresh = async () => {
      const request = ++version;
      if (!userId) { setMember(undefined); setLoading(false); return; }
      try {
        const { data, error } = await client.from('bookings')
          .select('id,session_id,sessions!inner(title,starts_at,ends_at,capacity),session_results(*),booking_tasks(tasks(title,completed))')
          .eq('user_id', userId).gt('sessions.ends_at', new Date().toISOString());
        if (!active || request !== version) return;
        if (error) throw error;
        const next = (data as unknown as Reservation[]).filter(item => !item.session_results?.finished_at).sort((a,b) => Date.parse(a.sessions.starts_at) - Date.parse(b.sessions.starts_at))[0];
        setMember(next ? { reservation: {
          title: next.sessions.title, startsAt: next.sessions.starts_at, endsAt: next.sessions.ends_at,
          capacity: next.sessions.capacity, bookingHref: `/sessions/book?session=${next.session_id}`,
          tasks: next.booking_tasks.flatMap(item => item.tasks ? [item.tasks.title + (item.tasks.completed ? '（已完成）' : '')] : []),
          detailsHref: `/my-sessions#${next.id}`, waitingHref: `/sessions/waiting/${next.session_id}`, roomHref: `/sessions/room/${next.session_id}`
        } } : {});
        setError(false);
      } catch { if (active && request === version) { setMember(undefined); setError(true); } }
      finally { if (active && request === version) setLoading(false); }
    };
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const nextId = session?.user.id ?? null;
      if (event === 'TOKEN_REFRESHED' && nextId === userId) return;
      ++version; userId = nextId; setMember(undefined); setError(false); setLoading(true);
      setTimeout(() => { if (active) void refresh(); }, 0);
    });
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener('zashipao-bookings-updated', refresh);
    window.addEventListener('zashipao-cloud-tasks-updated', refresh);
    return () => { active = false; ++version; subscription.unsubscribe(); clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('zashipao-bookings-updated', refresh); window.removeEventListener('zashipao-cloud-tasks-updated', refresh); };
  }, [retry]);
  if (loading) return <div role="status" className="rounded-xl2 border border-border bg-white p-6 shadow-lift">正在確認你的場次…</div>;
  if (error) return <div role="alert" className="rounded-xl2 border border-border bg-white p-6 shadow-lift"><h2 className="text-xl font-bold">暫時無法讀取你的預約</h2><p className="my-4 text-sm text-muted">請重試，或到已預約場次查看。</p><button onClick={() => setRetry(value => value + 1)} className="mr-4 min-h-11 text-terracotta underline">重試</button><ButtonLink href="/my-sessions" variant="outline">查看已預約場次</ButtonLink></div>;
  return <HomeSessionCard {...props} member={member} loadError={member ? false : props.loadError} />;
}
