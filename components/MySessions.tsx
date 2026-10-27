'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { browserAuth } from '@/lib/supabase/browser';
import { bookingError, sessionDate, sessionTime } from '@/lib/bookingErrors';
import { useSharedTasks } from './useSharedTasks';
import { Logo } from './Logo';
import { BookingTaskPicker } from './BookingTaskPicker';
import { BookedTaskContent } from './BookedTaskContent';
import { TaskSyncStatus } from './TaskSyncStatus';
import { AccountMenu } from './AccountMenu';
import { AddToCalendar } from './AddToCalendar';
import { SessionResult } from './SessionResult';

type Booking = { session_results: { finished_at?: string | null } | null; id: string; session_id: string; sessions: { title: string; starts_at: string; ends_at: string } | null; booking_tasks: { task_id: number }[] };
export function MySessions() {
  const [tasks, , sync] = useSharedTasks();
  const request = useRef(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [opened, setOpened] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    const token = ++request.current;
    setLoading(true); setError('');
    if (!sync.userId) { setBookings([]); setOwner(null); setLoading(false); return; }
    try {
      const { data, error } = await browserAuth().from('bookings').select('id,session_id,sessions(title,starts_at,ends_at),session_results(*),booking_tasks(task_id)').eq('user_id', sync.userId).order('created_at', { ascending: false });
      if (token !== request.current) return;
      if (error) throw error;
      setBookings(data as unknown as Booking[]); setOwner(sync.userId);
    } catch { if (token === request.current) setError('無法讀取預約，請稍後重試。'); }
    finally { if (token === request.current) setLoading(false); }
  }, [sync.userId]);
  useEffect(() => { void load(); window.addEventListener('focus', load); window.addEventListener('zashipao-bookings-updated', load); return () => { ++request.current; window.removeEventListener('focus', load); window.removeEventListener('zashipao-bookings-updated', load); }; }, [load]);
  const visible = owner === sync.userId ? bookings : [];
  const ended = (booking: Booking) => !!booking.session_results?.finished_at || !!booking.sessions && now !== null && Date.parse(booking.sessions.ends_at) <= now;
  const upcoming = visible.filter(booking => !ended(booking));
  const past = visible.filter(ended).sort((a, b) => Date.parse(b.session_results?.finished_at ?? b.sessions?.ends_at ?? '') - Date.parse(a.session_results?.finished_at ?? a.sessions?.ends_at ?? ''));
  const shown = view === 'past' ? past : upcoming;
  return <main className="min-h-screen bg-cream">
    <header className="border-b border-border bg-cream/95">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-6 gap-y-3 px-[5%] py-4 max-[900px]:grid-cols-[1fr_auto]">
        <Logo />
        <nav aria-label="主要導覽" className="flex items-center justify-end gap-2 text-sm max-[900px]:order-3 max-[900px]:col-span-2 max-[900px]:justify-start max-[900px]:overflow-x-auto">
          <Link href="/my-sessions" aria-current="page" className="shrink-0 rounded-full bg-terracotta-lt px-4 py-2.5 font-bold text-terracotta">已預約場次</Link>
          <Link href="/sessions" className="shrink-0 rounded-full px-4 py-2.5 text-muted hover:bg-white hover:text-ink">可預約場次</Link>
          <Link href="/tasks" className="shrink-0 rounded-full px-4 py-2.5 text-muted hover:bg-white hover:text-ink">我的待辦清單</Link>
        </nav>
        <div className="justify-self-end"><AccountMenu /></div>
      </div>
    </header>
    <div className="mx-auto max-w-5xl px-[5%] py-10 max-[640px]:py-7">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="font-serif text-4xl font-black max-[640px]:text-3xl">已預約場次</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">查看你已預約的場次，並確認這次要完成的待辦。</p></div>
      {visible.length > 0 ? <Link href="/sessions" className="rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white hover:bg-terracotta-d">預約新場次</Link> : null}
    </div>
    <div className="mb-6 flex gap-2" role="group" aria-label="場次分類">
      <button aria-pressed={view === 'upcoming'} onClick={() => setView('upcoming')} className={`rounded-full px-5 py-3 text-sm ${view === 'upcoming' ? 'bg-terracotta-lt font-bold text-terracotta' : 'text-muted'}`}>接下來的場次（{upcoming.length}）</button>
      <button aria-pressed={view === 'past'} onClick={() => setView('past')} className={`rounded-full px-5 py-3 text-sm ${view === 'past' ? 'bg-terracotta-lt font-bold text-terracotta' : 'text-muted'}`}>過往場次（{past.length}）</button>
    </div>
    {!loading && !error && view === 'past' && !past.length ? <p className="rounded-2xl bg-white p-8 text-muted">還沒有過往場次，完成一場後就能在這裡查看成果。</p> : null}
    {error ? <p role="alert" className="my-4 text-terracotta">{error} <button className="underline" onClick={() => void load()}>重新載入</button></p> : null}
    {loading ? <p role="status">正在載入預約…</p> : !error && view === 'upcoming' && !upcoming.length ? <section className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
      <svg aria-hidden="true" className="mx-auto mb-5 size-10 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18M9 16h6"/></svg>
      <h2 className="font-serif text-2xl font-bold">留一段時間，給一直想完成的事</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">你還沒有預約場次。挑一個適合的時段，帶一件待辦一起來。</p>
      <Link href="/sessions" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-terracotta px-6 py-3 text-sm font-bold text-white hover:bg-terracotta-d">選擇場次 →</Link>
    </section> : null}
    {sync.error ? <TaskSyncStatus /> : null}
    <div className="grid gap-4">{shown.map(booking => {
      const session = booking.sessions;
      if (view === 'past') return <article id={booking.id} key={booking.id} className="scroll-mt-8 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">{session?.title ?? '過往場次'}</h2>{session ? <p className="mt-2 text-sm text-muted">{sessionDate(session.starts_at)} · {sessionTime(session.starts_at)}–{sessionTime(session.ends_at)}</p> : null}</div>
        <button aria-expanded={opened === booking.id} onClick={() => setOpened(opened === booking.id ? null : booking.id)} className="rounded-full border border-border px-5 py-3 text-sm">{opened === booking.id ? '收起成果' : '查看成果'}</button></div>
        {opened === booking.id ? <div className="mt-6 border-t border-border pt-6"><SessionResult sessionId={booking.session_id} /></div> : null}
      </article>;
      const started = !session || (now !== null && Date.parse(session.starts_at) <= now);
      return <article id={booking.id} key={booking.id} className="scroll-mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl font-bold">{session?.title ?? '場次已停止公開'}</h2>
        {session ? <p className="mt-2 text-muted">{sessionDate(session.starts_at)} · {sessionTime(session.starts_at)}–{sessionTime(session.ends_at)}（台灣時間）</p> : null}
        <div className="my-4 grid gap-2">{sync.loading ? <p>正在載入本場待辦…</p> : booking.booking_tasks.map(item => {
          const task = tasks.find(t => t.id === Number(item.task_id));
          return <div className="flex items-center justify-between gap-3 rounded-xl bg-cream p-3" key={item.task_id}>
            {task ? <BookedTaskContent task={task} disabled={!!busy} /> : <span>待辦已移除</span>}
            {!started ? <button type="button" disabled={!!busy || sync.loading || sync.saving || !!sync.error} title="從本場移除" className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-terracotta disabled:opacity-40" aria-label={`從本場移除${task?.title ?? '待辦'}`} onClick={async () => {
              const remaining = booking.booking_tasks.filter(other => Number(other.task_id) !== Number(item.task_id)).map(other => Number(other.task_id));
              if (!remaining.length) { setError('本場至少需要一件待辦，請先用「安排本場待辦」加入其他項目，或取消整場預約。'); return; }
              if (!window.confirm(`將「${task?.title ?? '這件待辦'}」移出本場？原本的待辦會保留。`)) return;
              setBusy(booking.id); setError('');
              try {
                const { error } = await browserAuth().rpc('update_booking_tasks', { p_booking_id: booking.id, p_task_ids: remaining });
                if (error) throw error;
                window.dispatchEvent(new Event('zashipao-bookings-updated'));
                await load();
              } catch (e) {
                const message = (e as { message?: string })?.message ?? '';
                setError(message === 'SESSION_STARTED' ? '場次已開始，無法再移除預約待辦。' : bookingError(message));
              } finally { setBusy(null); }
            }}><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m6 6 12 12M18 6 6 18" /></svg></button> : null}
          </div>;
        })}</div>
        {session && !started ? <AddToCalendar session={{ id: booking.session_id, ...session }} /> : null}
        <BookingTaskPicker bookingId={booking.id} taskIds={booking.booking_tasks.map(item => Number(item.task_id))} disabled={!!busy || started} onSaved={load} />
        <div className="mb-4">
          {session && now !== null && now >= Date.parse(session.starts_at) - 300000 && now < Date.parse(session.ends_at) ? <Link href={`/sessions/waiting/${booking.session_id}`} className="inline-flex rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">進入等候區</Link> : <p className="text-xs text-light">{session && now !== null && now >= Date.parse(session.ends_at) ? '這場活動已結束。' : '等候區於活動開始前五分鐘開放。'}</p>}
        </div>
        <button disabled={!!busy || started} className="rounded-full border border-border px-4 py-2 text-sm text-muted disabled:opacity-40" onClick={async () => {
          if (!window.confirm('確定取消這場預約？待辦事項會保留。')) return;
          setBusy(booking.id); setError('');
          try {
            const { error } = await browserAuth().rpc('cancel_booking', { p_booking_id: booking.id });
            if (error) throw error;
            await load();
          } catch (e) { setError(bookingError((e as { message?: string })?.message ?? '')); }
          finally { setBusy(null); }
        }}>{busy === booking.id ? '取消中…' : started ? '場次已開始／已結束' : '取消預約'}</button>
      </article>;
    })}</div>
  </div></main>;
}
