'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserAuth } from '@/lib/supabase/browser';
import { bookingError, sessionDate, sessionTime } from '@/lib/bookingErrors';
import type { PublicSession } from '@/lib/publicSessions';
import { useSharedTasks } from './useSharedTasks';
import { TaskSyncStatus } from './TaskSyncStatus';
import { BookedTaskContent } from './BookedTaskContent';
import { Logo } from './Logo';
export function CloudBooking({ session, initialIds }: { session: PublicSession; initialIds: number[] }) {
  const [tasks, setTasks, sync] = useSharedTasks();
  const [ids, setIds] = useState(initialIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');
  const addLock = useRef(false);
  const router = useRouter();
  const available = tasks.filter(t => !t.completed && !t.archived);
  const selected = available.filter(t => ids.includes(t.id));
  return <main className="min-h-screen bg-cream px-[5%] py-8"><div className="mx-auto max-w-3xl">
    <Logo /><Link href="/sessions" className="my-6 block text-muted">← 重新選擇場次</Link>
    <section className="rounded-2xl border border-border bg-white p-6">
      <p className="text-sm text-terracotta">{sessionDate(session.starts_at)} · {sessionTime(session.starts_at)}–{sessionTime(session.ends_at)}（台灣時間）</p>
      <h1 className="mt-3 font-serif text-3xl font-black">{session.title}</h1>
      <p className="mt-3 text-muted">選擇這場要完成的待辦。剩餘名額以確認預約時為準。</p>
      <TaskSyncStatus />
      <fieldset disabled={busy || adding || sync.loading || sync.saving || !!sync.error || !sync.userId}>
        <form className="my-5 rounded-xl border border-border p-4" onSubmit={async event => {
          event.preventDefault();
          const name = title.trim();
          if (!name || addLock.current || busy || sync.loading || sync.saving || sync.error || !sync.userId) return;
          addLock.current = true; setAdding(true); setNotice('');
          try {
            const now = new Date();
            const firstNoticed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const id = Math.max(Date.now(), ...tasks.map(task => task.id + 1));
            if (!await setTasks(current => [...current, { id, title: name, deadline, firstNoticed, note: note.trim() || undefined }])) return;
            setIds(current => [...current, id]); setTitle(''); setDeadline(''); setNote('');
            setNotice('已新增到我的待辦清單，並自動勾選。按「確認預約」後才會加入本場。');
          } finally { addLock.current = false; setAdding(false); }
        }}>
          <h2 className="mb-3 font-bold">新增這場想完成的事</h2>
          <label className="grid gap-1 text-sm">待辦名稱
            <input required value={title} onChange={event => setTitle(event.target.value)} placeholder="例如：買電池、預約看診" className="min-h-11 min-w-0 rounded-lg border border-border px-3 py-2" />
          </label>
          <details className="mt-3 text-sm text-muted"><summary className="cursor-pointer py-2">補充日期與備註（選填）</summary>
            <label className="mt-2 grid gap-1">預計完成日期<input type="date" value={deadline} onChange={event => setDeadline(event.target.value)} className="min-w-0 rounded-lg border border-border px-3 py-2" /></label>
            <label className="mt-3 grid gap-1">備註<textarea value={note} onChange={event => setNote(event.target.value)} rows={2} className="min-w-0 rounded-lg border border-border px-3 py-2" /></label>
          </details>
          <button type="submit" disabled={!title.trim()} className="mt-3 min-h-11 rounded-full bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{adding ? '新增中…' : '新增並勾選'}</button>
          <p className="mt-3 text-xs text-muted">新增與編輯會同步到「我的待辦清單」，即使最後沒有預約也會保留。</p>
        </form>
        {notice ? <p role="status" className="my-3 text-sm text-forest">{notice}</p> : null}
        <h2 className="font-bold">選擇本場待辦</h2>
        <div className="my-5 grid gap-3">{available.map(task => <div key={task.id} className="flex items-start gap-3 rounded-xl bg-cream p-4">
          <input type="checkbox" aria-label={`選取${task.title}`} className="mt-3 size-5 shrink-0 accent-forest" checked={ids.includes(task.id)} onChange={event => setIds(current => event.target.checked ? [...current, task.id] : current.filter(id => id !== task.id))} />
          <BookedTaskContent task={task} disabled={busy || adding} />
        </div>)}</div>
        {!sync.loading && !available.length ? <p className="my-4 text-muted">還沒有待辦，直接在上方新增第一件即可。</p> : null}
        {error ? <p role="alert" className="my-4 text-terracotta">{error} <Link href="/my-sessions" className="underline">查看已預約場次</Link></p> : null}
        <button type="button" disabled={!selected.length || busy} className="w-full rounded-full bg-terracotta px-5 py-3 font-bold text-white disabled:opacity-40" onClick={async () => {
          setBusy(true); setError('');
          try {
            const { data, error } = await browserAuth().rpc('book_session', { p_session_id: session.id, p_task_ids: selected.map(t => t.id) });
            if (error) throw error;
            router.replace(`/my-sessions#${data}`); router.refresh();
          } catch (e) { setError(bookingError(e instanceof Error ? e.message : (e as { message?: string })?.message ?? '')); setBusy(false); }
        }}>{busy ? '正在確認預約…' : `確認預約（已選 ${selected.length} 件）`}</button>
      </fieldset>
    </section>
  </div></main>;
}
