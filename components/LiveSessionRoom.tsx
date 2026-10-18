'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { sessionDate, sessionTime } from '@/lib/bookingErrors';
import { RoomPresence } from './RoomPresence';
import { Logo } from './Logo';
import { SessionResult } from './SessionResult';
type Room = { finished_at?: string | null; title: string; starts_at: string; ends_at: string; server_time: string; tasks: { id: number; title: string; completed: boolean }[] };
const messages: Record<string, string> = { AUTH_REQUIRED: '請先登入。', PARTICIPATION_ENDED: '你已結束本場，請重新載入查看成果。', BOOKING_REQUIRED: '你尚未預約這場活動。', SESSION_NOT_STARTED: '這場活動尚未開始，請先到等候區。', SESSION_ENDED: '場次已結束，不能再從房間修改待辦。', SESSION_CLOSED: '這場活動已停止開放。', SESSION_NOT_FOUND: '找不到這場活動。', INVALID_TASKS: '這件待辦已不在本場，請重新載入。' };
export function LiveSessionRoom({ sessionId }: { sessionId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    let active = true, fetching = false;
    let reference: { end: number; server: number; local: number } | null = null;
    const refresh = async () => {
      if (fetching || lock.current) return;
      fetching = true;
      try {
        const { data, error } = await browserAuth().rpc('get_session_room', { p_session_id: sessionId });
        if (!active || token !== generation.current) return;
        if (lock.current) return;
        if (error) throw error;
        const result = data as Room;
        reference = { end: Date.parse(result.ends_at), server: Date.parse(result.server_time), local: performance.now() };
        setRoom(result); setRemaining(Math.max(0, Math.ceil((reference.end - reference.server) / 1000))); setError('');
      } catch (e) { if (active) { setRoom(null); reference = null; setError(messages[(e as {message?: string}).message ?? ''] ?? '連線失敗，請重新載入房間。'); } }
      finally { fetching = false; if (active) setLoading(false); }
    };
    setLoading(true); setRoom(null); void refresh();
    const poll = window.setInterval(refresh, 15000);
    const clock = window.setInterval(() => {
      if (!reference) return;
      const seconds = Math.max(0, Math.ceil((reference.end - reference.server - (performance.now() - reference.local)) / 1000));
      setRemaining(seconds);
    }, 1000);
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange(event => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      ++generation.current; setRoom(null); setRetry(value => value + 1);
    });
    window.addEventListener('focus', refresh);
    return () => { active = false; ++generation.current; clearInterval(poll); clearInterval(clock); subscription.unsubscribe(); window.removeEventListener('focus', refresh); };
  }, [sessionId, retry]);
  return <main className="min-h-screen bg-cream px-[5%] py-8"><div className="mx-auto max-w-3xl">
    <Logo /><Link href="/my-sessions" className="my-6 block text-sm text-muted">← 返回已預約場次</Link>
    <section className="rounded-2xl border border-border bg-white p-6">
      {loading ? <p role="status">正在確認場次資格…</p> : null}
      {error ? <div role="alert" className="my-4 text-terracotta">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>重新載入</button></div> : null}
      {room && (remaining === 0 || room.finished_at) ? <SessionResult sessionId={sessionId} /> : room ? <>
        <p className="text-sm font-bold text-forest">{remaining > 0 ? '一起專注' : '本場已結束'}</p>
        <h1 className="mt-3 font-serif text-3xl font-black">{room.title}</h1>
        <p className="mt-3 text-sm text-muted">{sessionDate(room.starts_at)} · {sessionTime(room.starts_at)}–{sessionTime(room.ends_at)}（台灣時間）</p>
        <div className="my-6 rounded-xl bg-forest-lt p-6 text-center text-forest"><p className="text-sm">{remaining > 0 ? '本場剩餘時間' : '本場待辦目前的完成狀態'}</p>
          <p className="mt-2 font-mono text-4xl font-bold">{remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2,'0')}` : `${room.tasks.filter(task => task.completed).length} / ${room.tasks.length} 件完成`}</p>
        </div>
        {remaining > 0 ? <RoomPresence sessionId={sessionId} /> : null}
        <p className="mb-3 text-sm text-muted">完成狀態會同步更新「我的待辦清單」。</p>
        <div className="grid gap-3">{room.tasks.map(task => <label key={task.id} className="flex items-center gap-3 rounded-xl bg-cream p-4">
          <input type="checkbox" className="size-5 accent-forest" checked={task.completed} disabled={finishing || busy !== null || remaining === 0} onChange={async event => {
            if (lock.current || remaining === 0) return;
            lock.current = true; setBusy(task.id); setError('');
            const completed = event.target.checked, token = generation.current;
            try {
              const { error } = await browserAuth().rpc('set_room_task_completed', { p_session_id: sessionId, p_task_id: task.id, p_completed: completed });
              if (error) throw error;
              if (generation.current === token) setRoom(current => current ? { ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, completed } : item) } : null);
              window.dispatchEvent(new Event('zashipao-cloud-tasks-updated'));
            } catch (e) { if (generation.current === token) setError(messages[(e as {message?: string}).message ?? ''] ?? '儲存結果未確認，請重新載入查看。'); }
            finally { lock.current = false; setBusy(null); }
          }}/><span className={task.completed ? 'text-muted line-through' : ''}>{task.title}</span>{busy === task.id ? <span role="status" className="text-xs text-muted">儲存中…</span> : null}
        </label>)}</div>
        {!room.tasks.length ? <p>本場沒有待辦。</p> : null}
        {'finished_at' in room ? <div className="mt-6 border-t border-border pt-5">
          <button disabled={finishing || busy !== null} className="rounded-full border border-border px-5 py-3 text-sm text-muted disabled:opacity-50" onClick={async () => {
            if (lock.current || !window.confirm('提前結束你自己的參與？本場成果將立即保存，無法再回房繼續；其他人不受影響，未完成待辦仍會保留。')) return;
            lock.current = true; setFinishing(true); setError('');
            const token = generation.current;
            try {
              const { error } = await browserAuth().rpc('finish_my_session', { p_session_id: sessionId });
              if (error) throw error;
              if (token === generation.current) setRetry(value => value + 1);
              window.dispatchEvent(new Event('zashipao-bookings-updated'));
            } catch (e) {
              if (token === generation.current) setError(messages[(e as { message?: string }).message ?? ''] ?? '結束結果尚未確認，請重新載入查看；可以安全重試。');
            } finally { lock.current = false; setFinishing(false); }
          }}>{finishing ? '正在保存成果…' : '提前結束本場'}</button>
          <p className="mt-2 text-xs text-muted">只結束自己的參與，其他人仍可繼續。</p>
        </div> : null}
      </> : !loading ? <Link href={`/sessions/waiting/${sessionId}`} className="text-forest underline">返回等候區</Link> : null}
    </section>
  </div></main>;
}
