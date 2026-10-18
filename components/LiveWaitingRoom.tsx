'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { sessionDate, sessionTime } from '@/lib/bookingErrors';
import { RoomPresence } from './RoomPresence';
import { Logo } from './Logo';
import { NicknameEditor } from './NicknameEditor';
import { CameraPreview } from './CameraPreview';
type Waiting = { id: string; title: string; starts_at: string; ends_at: string; server_time: string; tasks: { id: number; title: string; completed: boolean }[] };
export function LiveWaitingRoom({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Waiting | null>(null);
  const [message, setMessage] = useState('正在確認預約與開放時間…');
  const [retry, setRetry] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let active = true;
    let refreshing = false;
    let reference: { start: number; end: number; server: number; local: number } | null = null;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const { data, error } = await browserAuth().rpc('get_waiting_session', { p_session_id: sessionId });
        if (!active) return;
        if (error) {
          const copy: Record<string, string> = { AUTH_REQUIRED: '請先登入。', PARTICIPATION_ENDED: '你已提前結束本場，可返回已預約場次查看成果。', BOOKING_REQUIRED: '你尚未預約這場活動。', WAITING_NOT_OPEN: '等候區會在活動開始前五分鐘開放。', SESSION_ENDED: '這場活動已結束。', SESSION_CLOSED: '這場活動已停止開放。', SESSION_NOT_FOUND: '找不到這場活動。' };
          setData(null); reference = null;
          setMessage(copy[error.message] ?? '暫時無法載入等候區，請稍後重試。'); return;
        }
        const result = data as Waiting;
        reference = { start: Date.parse(result.starts_at), end: Date.parse(result.ends_at), server: Date.parse(result.server_time), local: performance.now() };
        setSeconds(Math.max(0, Math.ceil((reference.start - reference.server) / 1000)));
        setData(result); setMessage('');
      } catch { if (active) { setData(null); reference = null; setMessage('連線失敗，請重試。'); } }
      finally { refreshing = false; }
    };
    setData(null); setMessage('正在確認預約與開放時間…');
    void refresh();
    const poll = window.setInterval(refresh, 15000);
    const clock = window.setInterval(() => {
      if (!reference) return;
      const now = reference.server + performance.now() - reference.local;
      if (now >= reference.end) { setData(null); setMessage('這場活動已結束。'); reference = null; return; }
      setSeconds(Math.max(0, Math.ceil((reference.start - now) / 1000)));
    }, 1000);
    window.addEventListener('focus', refresh);
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      if (active) { active = false; setData(null); reference = null; setRetry(value => value + 1); }
    });
    return () => { active = false; clearInterval(poll); clearInterval(clock); window.removeEventListener('focus', refresh); subscription.unsubscribe(); };
  }, [sessionId, retry]);
  return <main className="min-h-screen bg-cream px-[5%] py-8"><div className="mx-auto max-w-3xl">
    <Logo /><Link href="/my-sessions" className="my-6 block text-sm text-muted">← 返回已預約場次</Link>
    <section className="rounded-2xl border border-border bg-white p-6">
      <p className="text-sm font-bold text-forest">等候區</p>
      {data ? <>
        <h1 className="mt-3 font-serif text-3xl font-black">{data.title}</h1>
        <p className="mt-3 text-sm text-muted">{sessionDate(data.starts_at)} · {sessionTime(data.starts_at)}–{sessionTime(data.ends_at)}（台灣時間）</p>
        <p className="my-6 rounded-xl bg-forest-lt p-4 text-forest">{seconds > 0 ? `距離開場 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '已到開場時間，可以進入房間了。'}</p>
        <NicknameEditor />
        <CameraPreview key={sessionId} />
        {seconds === 0 ? <Link href={`/sessions/room/${sessionId}`} className="mb-6 inline-flex rounded-full bg-terracotta px-6 py-3 font-bold text-white">進入房間</Link> : null}
        <RoomPresence sessionId={sessionId} />
        <h2 className="mb-3 font-bold">這場要完成的待辦</h2>
        <ul className="grid gap-2">{data.tasks.map(task => <li className="rounded-xl bg-cream p-3" key={task.id}>{task.title}{task.completed ? '（已完成）' : ''}</li>)}</ul>
        {!data.tasks.length ? <p className="text-muted">本場目前沒有待辦。</p> : null}
      </> : <div role="status"><p className="my-4">{message}</p><button onClick={() => setRetry(value => value + 1)} className="rounded-full border border-border px-4 py-2">重新確認</button></div>}
    </section>
  </div></main>;
}
