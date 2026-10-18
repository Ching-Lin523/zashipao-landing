"use client";

import { useEffect, useState } from "react";
import { useSharedTasks } from "./useSharedTasks";
import { TaskSyncStatus } from "./TaskSyncStatus";

export function SessionTaskEditor({ sessionId, initialTasks }: { sessionId: string; initialTasks: string[] }) {
  const [tasks, setTasks, sync] = useSharedTasks();
  const [ids, setIds] = useState<number[]>([]);
  const [draft, setDraft] = useState<number[] | null>(null);
  const [picker, setPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const storageKey = `zashipao:session-task-ids:${sessionId}`;

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved) && saved.every(id => typeof id === "number")) {
        setIds(saved);
      } else {
        const legacy: unknown = JSON.parse(localStorage.getItem(`zashipao:session-tasks:${sessionId}`) ?? "null");
        const titles = Array.isArray(legacy) && legacy.every(t => typeof t === "string") ? legacy as string[] : initialTasks;
        const selected = tasks.filter(task => titles.includes(task.title)).map(task => task.id);
        setIds(selected);
      }
    } catch { setIds(tasks.filter(t => initialTasks.includes(t.title)).map(t => t.id)); }
    setReady(true);
  }, [storageKey, sessionId, initialTasks, tasks]);

  const selected = (draft ?? ids).map(id => tasks.find(task => task.id === id)).filter(task => task !== undefined);
  const available = tasks.filter(task => !task.completed && !task.archived);
  const button = "rounded-full border border-border px-4 py-2 text-sm font-bold text-muted hover:border-terracotta";

  return (
    <fieldset disabled={sync.loading || sync.saving || !!sync.error || !sync.userId} className="mt-3 grid min-w-0 gap-2">
      <TaskSyncStatus />
      <div className="text-xs font-bold text-light">這場要做的事</div>
      {selected.map(task => (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2 text-sm font-semibold text-muted" key={task.id}>
          <span>{task.title}{task.completed ? "（已完成）" : task.archived ? "（已封存）" : ""}</span>
          {draft !== null ? <button type="button" className="shrink-0 p-1 text-terracotta" aria-label={`從本場移除${task.title}`} onClick={() => setDraft(draft.filter(id => id !== task.id))}>移除</button> : null}
        </div>
      ))}
      {draft === null ? (
        <button disabled={!ready} type="button" className={`${button} mt-1 justify-self-start`} onClick={() => { setDraft([...ids]); setPicker(false); setNotice(""); }}>調整本場事項</button>
      ) : (
        <>
          <button type="button" className="justify-self-start py-2 text-sm font-bold text-terracotta" aria-expanded={picker} onClick={() => setPicker(!picker)}>＋ 加入或新增事項</button>
          {picker ? (
            <div className="grid gap-3 rounded-xl border border-border p-3">
              <h3 className="text-sm font-bold">從我的待辦清單加入</h3>
              <div className="grid max-h-60 gap-2 overflow-y-auto">
                {available.map(task => (
                  <label className="flex items-center gap-2 rounded-lg bg-cream p-2 text-sm" key={task.id}>
                    <input type="checkbox" checked={draft.includes(task.id)} onChange={event => setDraft(event.target.checked ? [...draft, task.id] : draft.filter(id => id !== task.id))} />
                    <span className="flex-1">{task.title}</span>
                    {draft.includes(task.id) ? <span className="text-xs text-forest">已選</span> : null}
                  </label>
                ))}
                {!available.length ? <p className="text-sm text-muted">目前沒有未完成待辦，可以先建立一件。</p> : null}
              </div>
              <form className="grid gap-2 border-t border-border pt-3" onSubmit={async event => {
                event.preventDefault();
                if (!title.trim()) return;
                try {
                  const all = tasks;
                  const id = Math.max(Date.now(), ...all.map(task => task.id + 1));
                  const today = new Date().toISOString().slice(0, 10);
                  if (!await setTasks([...all, { id, title: title.trim(), firstNoticed: today, deadline: "" }])) return;
                  setDraft([...draft, id]);
                  setTitle("");
                  setNotice("新待辦已加入我的待辦清單，也已選進本場。");
                } catch { setNotice("無法儲存新待辦，請確認瀏覽器允許本機儲存。"); }
              }}>
                <label className="text-sm font-bold" htmlFor={`new-task-${sessionId}`}>或新增一件事</label>
                <input id={`new-task-${sessionId}`} className="min-w-0 rounded-lg border border-border px-3 py-2 text-sm" value={title} onChange={event => setTitle(event.target.value)} placeholder="輸入想完成的事" />
                <button disabled={!title.trim()} className={`${button} justify-self-start disabled:opacity-40`} type="submit">加入本場</button>
              </form>
            </div>
          ) : null}
          <p className="text-xs text-muted">從本場移除後，事項仍會保留在我的待辦清單裡。</p>
          <div className="flex gap-2">
            <button type="button" disabled={!selected.length} className="rounded-full bg-terracotta px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={() => {
              try {
                const next = selected.map(task => task.id);
                localStorage.setItem(storageKey, JSON.stringify(next));
                window.dispatchEvent(new Event("zashipao-session-tasks"));
                setIds(next); setDraft(null); setPicker(false); setNotice("這場要做的事已更新");
              } catch { setNotice("儲存失敗，請重試。變更尚未儲存。"); }
            }}>儲存本場事項</button>
            <button type="button" className={button} onClick={() => { setDraft(null); setPicker(false); setTitle(""); setNotice(""); }}>取消</button>
          </div>
        </>
      )}
      <p role="status" className="text-xs text-muted">{notice}</p>
    </fieldset>
  );
}
