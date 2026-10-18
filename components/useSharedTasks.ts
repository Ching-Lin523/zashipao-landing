"use client";
import { useEffect, useSyncExternalStore, type SetStateAction } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import type { Task } from './taskStore';

type State = { tasks: Task[]; loading: boolean; saving: boolean; error: string; userId: string | null };
const initial: State = { tasks: [], loading: true, saving: false, error: '', userId: null };
let state = initial;
let generation = 0;
let started = false;
const listeners = new Set<() => void>();
function publish(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const columns = 'id,title,deadline,first_noticed,completed,archived,priority,note,sort_order';
function fromRow(row: Record<string, unknown>): Task {
  return { id: Number(row.id), title: String(row.title), deadline: row.deadline ? String(row.deadline) : '',
    firstNoticed: String(row.first_noticed), completed: Boolean(row.completed), archived: Boolean(row.archived),
    priority: Boolean(row.priority), note: row.note ? String(row.note) : undefined,
    order: typeof row.sort_order === 'number' ? row.sort_order : undefined };
}
function toRow(task: Task, userId: string) {
  return { user_id: userId, id: task.id, title: task.title, deadline: task.deadline || null,
    first_noticed: task.firstNoticed, completed: !!task.completed, archived: !!task.archived,
    priority: !!task.priority, note: task.note || null, sort_order: task.order ?? null };
}
async function refresh() {
  if (!state.userId || state.saving) return;
  const userId = state.userId;
  const token = ++generation;
  publish({ loading: true, error: '' });
  try {
    const { data, error } = await browserAuth().from('tasks').select(columns).eq('user_id', userId).order('id', { ascending: false });
    if (error) throw error;
    if (token === generation) publish({ tasks: (data ?? []).map(fromRow), loading: false });
  } catch {
    if (token === generation) publish({ loading: false, error: '無法載入雲端待辦，請檢查網路後重試。' });
  }
}
function start() {
  if (started) return;
  started = true;
  browserAuth().auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    if (userId === state.userId && !state.loading) return;
    ++generation;
    publish({ ...initial, userId, loading: !!userId });
    // Run outside the auth callback's lock.
    if (userId) setTimeout(() => { void refresh(); }, 0);
  });
  window.addEventListener('focus', () => { void refresh(); });
  window.addEventListener('zashipao-cloud-tasks-updated', () => { void refresh(); });
}
async function updateTasks(update: SetStateAction<Task[]>): Promise<boolean> {
  if (!state.userId || state.loading || state.saving || state.error) return false;
  const userId = state.userId;
  const token = ++generation;
  const before = state.tasks;
  const next = typeof update === 'function' ? update(before) : update;
  const changed = next.filter(task => JSON.stringify(toRow(task, userId)) !== JSON.stringify(before.find(old => old.id === task.id) ? toRow(before.find(old => old.id === task.id)!, userId) : null));
  const removed = before.filter(task => !next.some(item => item.id === task.id)).map(task => task.id);
  publish({ saving: true, error: '' });
  try {
    // Existing UI operations either delete rows or upsert rows, never both.
    if (changed.length && removed.length) throw new Error('Mixed operation is not supported');
    if (changed.length) {
      const { data, error } = await browserAuth().from('tasks').upsert(changed.map(task => toRow(task, userId)), { onConflict: 'user_id,id' }).select('id');
      if (error || data?.length !== changed.length) throw error ?? new Error('Incomplete write');
    }
    if (removed.length) {
      const { data, error } = await browserAuth().from('tasks').delete().eq('user_id', userId).in('id', removed).select('id');
      if (error || data?.length !== removed.length) throw error ?? new Error('Incomplete delete');
    }
    if (token !== generation) return false;
    publish({ tasks: next, saving: false });
    return true;
  } catch {
    if (token === generation) publish({ saving: false, error: '儲存未確認成功。請重新載入雲端資料確認後，再重試操作。' });
    return false;
  }
}
export function useSharedTasks() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  useEffect(start, []);
  return [snapshot.tasks, updateTasks, { ...snapshot, reload: refresh }] as const;
}
