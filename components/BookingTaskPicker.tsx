'use client';
import { useRef, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { bookingError } from '@/lib/bookingErrors';
import { useSharedTasks } from './useSharedTasks';
import { TaskSyncStatus } from './TaskSyncStatus';
export function BookingTaskPicker({ bookingId, taskIds, disabled, onSaved }: {
  bookingId: string; taskIds: number[]; disabled: boolean; onSaved: () => Promise<void>;
}) {
  const [tasks, setTasks, sync] = useSharedTasks();
  const [draft, setDraft] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const addLock = useRef(false);
  const available = tasks.filter(task => !task.completed && !task.archived);
  const selected = available.filter(task => draft?.includes(task.id)).map(task => task.id);
  if (draft === null) return <button type="button" disabled={disabled || sync.loading || !!sync.error} className="mb-4 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted disabled:opacity-40" onClick={() => {
    setDraft(taskIds.filter(id => available.some(task => task.id === id))); setError(''); setShowNew(false); setTitle(''); setNotice('');
  }}>安排本場待辦</button>;
  return <section aria-label="安排本場待辦" className="my-4 rounded-xl border border-border p-4">
    <h3 className="font-bold">這場想完成哪些事？</h3>
    <p className="mt-2 text-xs text-muted">至少保留一件未完成待辦。移除項目不會刪除原本的待辦，也不影響預約名額。</p>
    <TaskSyncStatus />
    <fieldset disabled={busy || adding || disabled || sync.loading || sync.saving || !!sync.error}>
      <div className="my-3 grid max-h-64 gap-2 overflow-y-auto">{available.map(task => <label key={task.id} className="flex items-center gap-3 rounded-lg bg-cream p-3 text-sm">
        <input type="checkbox" className="size-5 accent-forest" checked={draft.includes(task.id)} onChange={event => setDraft(event.target.checked ? [...draft, task.id] : draft.filter(id => id !== task.id))} />{task.title}
      </label>)}</div>
      {!available.length ? <p className="my-3 text-sm text-muted">目前沒有可選待辦，可以直接在下方新增。</p> : null}
      {showNew ? <form className="my-4 rounded-xl border border-border p-3" onSubmit={async event => {
        event.preventDefault();
        const name = title.trim();
        if (!name || addLock.current || busy || disabled || sync.loading || sync.saving || sync.error || !sync.userId) return;
        addLock.current = true; setAdding(true); setNotice('');
        try {
          const now = new Date();
          const firstNoticed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const id = Math.max(Date.now(), ...tasks.map(task => task.id + 1));
          const saved = await setTasks(current => [...current, { id, title: name, deadline: '', firstNoticed }]);
          if (!saved) return;
          setDraft(current => current === null ? null : [...current, id]);
          setTitle(''); setShowNew(false);
          setNotice('新待辦已存進我的待辦清單並勾選。按「儲存」後才會加入本場；取消編輯仍會保留新待辦。');
        } finally { addLock.current = false; setAdding(false); }
      }}>
        <label htmlFor={`booking-new-task-${bookingId}`} className="mb-2 block text-sm font-bold">新增待辦</label>
        <div className="flex flex-wrap gap-2">
          <input id={`booking-new-task-${bookingId}`} autoFocus value={title} onChange={event => setTitle(event.target.value)} required className="min-h-11 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm" placeholder="例如：買電池、預約看診" />
          <button type="submit" disabled={!title.trim()} className="rounded-full bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{adding ? '新增中…' : '新增並勾選'}</button>
          <button type="button" className="px-3 py-2 text-sm text-muted" onClick={() => { setShowNew(false); setTitle(''); }}>收起</button>
        </div>
        <p className="mt-2 text-xs text-muted">會存進我的待辦清單；本場預約需再按下方「儲存」。</p>
      </form> : <button type="button" className="mb-4 min-h-11 text-sm font-bold text-terracotta" onClick={() => setShowNew(true)}>＋新增待辦</button>}
      {notice ? <p role="status" className="mb-3 text-sm text-forest">{notice}</p> : null}
      {error ? <p role="alert" className="my-3 text-sm text-terracotta">{error}</p> : null}
      <div className="flex gap-3">
        <button type="button" disabled={!selected.length} className="rounded-full bg-terracotta px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={async () => {
          setBusy(true); setError('');
          try {
            const { error } = await browserAuth().rpc('update_booking_tasks', { p_booking_id: bookingId, p_task_ids: selected });
            if (error) throw error;
            window.dispatchEvent(new Event('zashipao-bookings-updated'));
            await onSaved(); setDraft(null);
          } catch (e) {
            const message = (e as { message?: string })?.message ?? '';
            setError(message === 'SESSION_STARTED' ? '場次已開始，無法再調整預約待辦。' : bookingError(message));
          } finally { setBusy(false); }
        }}>{busy ? '儲存中…' : `儲存（${selected.length} 件）`}</button>
        <button type="button" className="px-4 py-2 text-sm text-muted" onClick={() => setDraft(null)}>取消</button>
      </div>
    </fieldset>
  </section>;
}
