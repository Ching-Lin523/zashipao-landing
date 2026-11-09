'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { taipeiWeek } from '@/lib/weeklyTasks';
import { useSharedTasks } from './useSharedTasks';
import { TaskSessionBadge } from './TaskSessionBadge';
type Goal = { id: string; title: string; weekly_count: number; active: boolean };
export function WeeklyTasks({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tasks, setTasks, sync] = useSharedTasks();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [offset, setOffset] = useState(0);
  const [week, setWeek] = useState(() => taipeiWeek());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setWeek(taipeiWeek(new Date(), offset));
    update(); const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, [offset]);
  useEffect(() => {
    let active = true;
    setGoals([]); setReady(false); setError('');
    if (!sync.userId) return;
    const load = async () => {
      const client = browserAuth();
      const result = await client.from('weekly_goals').select('id,title,weekly_count,active').eq('user_id', sync.userId!).order('created_at');
      if (!active) return;
      if (result.error) { setError('每週重複待辦尚未就緒，請確認資料庫更新與連線。一般待辦仍可照常使用。'); return; }
      setGoals(result.data);
      const generated = week < taipeiWeek() ? { error: null } : await client.rpc('ensure_weekly_tasks', { p_week: week });
      if (!active) return;
      if (generated.error) { setError('無法準備這週的待辦，請重試。'); return; }
      setReady(true);
      window.dispatchEvent(new Event('zashipao-cloud-tasks-updated'));
    };
    void load().catch(() => { if (active) setError('無法連線，請稍後重試。'); });
    return () => { active = false; };
  }, [sync.userId, week, revision, refreshKey]);
  async function toggleGoal(goal: Goal) {
    if (busy || !sync.userId) return;
    setBusy(true);
    try {
      const { data, error } = await browserAuth().from('weekly_goals').update({ active: !goal.active }).eq('user_id', sync.userId).eq('id', goal.id).select('id');
      if (error || data?.length !== 1) throw error;
      setRevision(x => x + 1);
    } catch { setError('變更未確認成功，請重新載入確認。'); }
    finally { setBusy(false); }
  }
  if (ready && goals.length === 0) return null;
  return <section aria-label="每週重複待辦" className="mb-6 rounded-2xl border border-border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-serif text-xl font-bold text-ink">每週重複待辦</h2>
      <div className="flex gap-2">{[-1,0,1].map(n => <button type="button" key={n} onClick={() => setOffset(n)} aria-pressed={offset===n} className={`rounded-full px-4 py-2 text-sm ${offset===n?'bg-forest text-white':'bg-cream text-ink'}`}>{n===-1?'上週':n===0?'本週':'下週'}</button>)}</div>
    </div>
    <p className="mt-2 text-sm leading-6 text-muted">{week} 起的一週（台灣時間） · 點開目標，安排每一次。</p>
    {error && <p role="alert" className="mt-3 text-sm text-terracotta">{error} <button type="button" className="underline" onClick={() => setRevision(x=>x+1)}>重新載入</button></p>}
    {!ready && !error && <p role="status" className="mt-3 text-sm text-muted">正在準備每週待辦…</p>}
    <div className="mt-4 space-y-3">{goals.map(goal => {
      const occurrences = tasks.filter(t=>t.weeklyGoalId===goal.id&&t.occurrenceWeek===week).sort((a,b)=>(a.occurrenceNumber??0)-(b.occurrenceNumber??0));
      const completed = occurrences.filter(t=>t.completed).length;
      return <details key={goal.id} className="rounded-xl border border-border bg-cream p-4">
        <summary className="cursor-pointer font-bold">{goal.title} <span className="ml-2 text-sm font-normal text-forest">{completed}／{goal.weekly_count} 次完成{!goal.active?' · 已暫停':''}</span></summary>
        <div className="mt-3 space-y-2">{occurrences.map(task=><div key={task.id} className="rounded-xl bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!task.completed} disabled={sync.loading||sync.saving||!!sync.error||busy} onChange={()=>void setTasks(current=>current.map(t=>t.id===task.id?{...t,completed:!t.completed}:t))} className="size-5 accent-[#4A7260]" />第{task.occurrenceNumber}次{task.completed?' · 已完成':''}</label>
          {!task.completed&&!task.archived&&<Link className="rounded-full border border-border px-3 py-2 text-sm text-forest" href={`/sessions?tasks=${task.id}`}>選擇場次</Link>}</div>
          <TaskSessionBadge taskId={task.id} />
        </div>)}</div>
        <button type="button" disabled={busy||!ready} onClick={()=>void toggleGoal(goal)} className="mt-3 text-sm text-muted underline">{goal.active?'暫停未來重複':'恢復每週重複'}</button>
        {!goal.active&&<p className="mt-2 text-xs text-muted">已建立的次數與預約保留；暫停後不再產生新的週次。</p>}
      </details>;
    })}</div>
    <p className="mt-4 text-xs leading-6 text-muted">每次可分別完成或安排場次；新的一週重新累計，過去紀錄會保留。</p>
  </section>;
}
