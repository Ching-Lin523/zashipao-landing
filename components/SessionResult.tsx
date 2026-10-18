'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { sessionDate, sessionTime } from '@/lib/bookingErrors';

type Result = { finished_at?: string | null; title: string; starts_at: string; ends_at: string; total_count: number; completed_count: number; tasks: { id: number; title: string; completed: boolean }[] };
export function SessionResult({ sessionId }: { sessionId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setResult(null); setError('');
    void (async () => {
      try {
        const { data, error } = await browserAuth().rpc('get_session_result', { p_session_id: sessionId });
        if (!active) return;
        if (error) throw error;
        setResult(data as Result);
      } catch (e) {
        if (!active) return;
        const message = (e as { message?: string }).message;
        setError(message === 'RESULT_UNAVAILABLE' ? '這場活動結束時尚未啟用成果紀錄，因此沒有保存當時的完成狀態。' : message === 'SESSION_NOT_ENDED' ? '場次尚未結束，請稍後重新載入成果。' : message === 'BOOKING_REQUIRED' || message === 'AUTH_REQUIRED' ? '請登入預約這場活動的帳號查看成果。' : '暫時無法載入成果，請重試。');
      } finally { if (active) setLoading(false); }
    })();
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange(event => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      active = false; setResult(null); setRetry(value => value + 1);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [sessionId, retry]);
  return <section aria-label="本場成果">
    {loading ? <p role="status">正在載入本場成果…</p> : null}
    {error ? <p role="alert" className="text-muted">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>重新載入</button></p> : null}
    {result ? <>
      <p className="text-sm font-bold text-forest">{result.finished_at ? '你已提前結束本場' : '本場已結束'}</p>
      <h2 className="mt-3 font-serif text-3xl font-black">{result.title}</h2>
      <p className="mt-3 text-sm text-muted">{sessionDate(result.starts_at)} · {sessionTime(result.starts_at)}–{sessionTime(result.ends_at)}（台灣時間）</p>
      <div className="my-6 rounded-xl bg-forest-lt p-6 text-center text-forest"><p>本場成果</p><p className="mt-2 text-4xl font-bold">{result.completed_count} / {result.total_count} <span className="text-lg">件完成</span></p></div>
      <p className="mb-4 text-sm text-muted">{result.finished_at ? `已於 ${sessionTime(result.finished_at)} 保存你的成果。` : '這是場次結束時的紀錄。'}之後修改待辦不會影響本場成果。</p>
      <ul className="grid gap-3">{result.tasks.map(task => <li key={task.id} className="flex items-start justify-between gap-4 rounded-xl bg-cream p-4"><span className="min-w-0 break-words">{task.title}</span><span className={`shrink-0 text-sm ${task.completed ? 'text-forest' : 'text-muted'}`}>{task.completed ? '已完成' : '未完成'}</span></li>)}</ul>
      {!result.tasks.length ? <p className="text-muted">本場沒有保留的待辦項目。</p> : null}
    </> : null}
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/tasks" className="rounded-full border border-border px-5 py-3 text-sm">回到我的待辦清單</Link><Link href="/sessions" className="rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white">安排下一場 →</Link></div>
  </section>;
}
