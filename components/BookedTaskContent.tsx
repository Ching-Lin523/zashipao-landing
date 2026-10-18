'use client';
import { useState } from 'react';
import type { Task } from './taskStore';
import { useSharedTasks } from './useSharedTasks';
import { TaskSyncStatus } from './TaskSyncStatus';
export function BookedTaskContent({ task, disabled }: { task: Task; disabled: boolean }) {
  const [, setTasks, sync] = useSharedTasks();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  if (!editing) return <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
    <div className="min-w-0 break-words">
      <span>{task.title}{task.completed ? '（已完成）' : ''}</span>
      {task.deadline ? <p className="mt-1 text-xs text-muted">預計完成 {task.deadline.replaceAll('-', '/')}</p> : null}
      {task.note ? <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{task.note}</p> : null}
    </div>
    <button type="button" disabled={disabled || sync.saving || !!sync.error} title="編輯待辦" aria-label={`編輯${task.title}`} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white disabled:opacity-40" onClick={() => {
      setTitle(task.title); setDeadline(task.deadline); setNote(task.note ?? ''); setEditing(true);
    }}><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m16 3 5 5-12 12-6 1 1-6Z M13 6l5 5" /></svg></button>
  </div>;
  return <form className="min-w-0 flex-1" onSubmit={async event => {
    event.preventDefault();
    if (!title.trim() || disabled || sync.saving || sync.loading || sync.error) return;
    if (await setTasks(current => current.map(item => item.id === task.id ? { ...item, title: title.trim(), deadline, note: note.trim() || undefined } : item))) setEditing(false);
  }}>
    <p className="mb-3 text-xs text-muted">修改會同步到「我的待辦清單」及引用此待辦的其他場次。</p>
    <TaskSyncStatus />
    <fieldset disabled={disabled || sync.saving || sync.loading || !!sync.error} className="grid min-w-0 gap-3">
      <label className="grid gap-1 text-sm">待辦名稱<input autoFocus required value={title} onChange={event => setTitle(event.target.value)} className="min-w-0 rounded-lg border border-border bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">預計完成日期<input type="date" value={deadline} onChange={event => setDeadline(event.target.value)} className="min-w-0 rounded-lg border border-border bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">備註<textarea rows={2} value={note} onChange={event => setNote(event.target.value)} className="min-w-0 rounded-lg border border-border bg-white px-3 py-2" /></label>
      <div className="flex gap-3"><button type="submit" disabled={!title.trim()} className="rounded-full bg-terracotta px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{sync.saving ? '儲存中…' : '儲存修改'}</button><button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-sm text-muted">取消</button></div>
    </fieldset>
  </form>;
}
