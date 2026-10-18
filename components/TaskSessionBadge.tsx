'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { sessionDate, sessionTime } from '@/lib/bookingErrors';
import { useSharedTasks } from './useSharedTasks';
type Assignment = { booking_id: string; bookings: { sessions: { starts_at: string } | null } | null };
export function TaskSessionBadge({ taskId }: { taskId: number }) {
  const [, , sync] = useSharedTasks();
  const [items, setItems] = useState<Assignment[]>([]);
  useEffect(() => {
    let active = true;
    setItems([]);
    if (!sync.userId) return;
    const load = async () => {
      const { data, error } = await browserAuth().from('booking_tasks').select('booking_id,bookings(sessions(starts_at))').eq('user_id', sync.userId!).eq('task_id', taskId);
      if (active) setItems(error ? [] : (data as unknown as Assignment[]).filter(item => item.bookings?.sessions && Date.parse(item.bookings.sessions.starts_at) > Date.now()));
    };
    void load();
    window.addEventListener('focus', load);
    window.addEventListener('zashipao-bookings-updated', load);
    return () => { active = false; window.removeEventListener('focus', load); window.removeEventListener('zashipao-bookings-updated', load); };
  }, [taskId, sync.userId]);
  return <div>{items.map(item => <Link key={item.booking_id} href={`/my-sessions#${item.booking_id}`} className="mt-2 block text-xs font-medium text-lavender hover:underline">已排入 {sessionDate(item.bookings!.sessions!.starts_at)} {sessionTime(item.bookings!.sessions!.starts_at)} →</Link>)}</div>;
}
