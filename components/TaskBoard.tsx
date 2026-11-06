"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSharedTasks } from "./useSharedTasks";
import type { Task } from "./taskStore";
import { TaskSyncStatus } from "./TaskSyncStatus";
import { Logo } from "./Logo";
import { TaskSessionBadge } from "./TaskSessionBadge";

type TaskStatus = "overdue" | "urgent" | "stale" | "open";

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

const statusStyle: Record<TaskStatus, { label: string; className: string; rowClass: string; sort: number }> = {
  overdue: {
    label: "已過期",
    className: "bg-[#FCEBEB] text-[#E24B4A]",
    rowClass: "border-l-[#E24B4A]",
    sort: 1
  },
  urgent: {
    label: "快到期",
    className: "bg-terracotta-lt text-terracotta",
    rowClass: "border-l-terracotta",
    sort: 2
  },
  stale: {
    label: "拖很久",
    className: "bg-lavender-lt text-lavender",
    rowClass: "border-l-lavender",
    sort: 3
  },
  open: {
    label: "一般",
    className: "bg-cream-dd text-muted",
    rowClass: "border-l-border-d",
    sort: 4
  }
};

function daysBetween(from: string, to = localDate()) {
  return Math.max(0, calendarDay(to) - calendarDay(from));
}

function daysUntil(deadline: string, from = localDate()) {
  if (!deadline) return Number.POSITIVE_INFINITY;
  return calendarDay(deadline) - calendarDay(from);
}

function getTaskStatus(task: Task): TaskStatus {
  const dueIn = daysUntil(task.deadline);
  const delayed = daysBetween(task.firstNoticed);

  if (dueIn < 0) return "overdue";
  if (dueIn <= 3) return "urgent";
  if (delayed >= 21) return "stale";
  return "open";
}

function defaultDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return localDate(date);
}

function formatDeadline(deadline: string) {
  if (!deadline) return "未設定期限";
  const dueIn = daysUntil(deadline);
  if (dueIn < 0) return `已過期 ${Math.abs(dueIn)} 天`;
  if (dueIn === 0) return "今天到期";
  return `${dueIn} 天後到期`;
}

export function TaskBoard() {
  const router = useRouter();
  const [today, setToday] = useState(localDate);
  useEffect(() => {
    const refresh = () => setToday(localDate());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const [undoIds, setUndoIds] = useState<number[]>([]);
  useEffect(() => {
    if (!undoIds.length) return;
    const timer = window.setTimeout(() => setUndoIds([]), 8000);
    return () => window.clearTimeout(timer);
  }, [undoIds]);
  const [bookingIds, setBookingIds] = useState<number[]>([]);
  const [tasks, setTasks, taskSync] = useSharedTasks();
  const [localBackup, setLocalBackup] = useState<Task[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('zashipao:tasks:v1') ?? 'null');
      if (Array.isArray(saved) && saved.every(task => Number.isSafeInteger(task.id) && task.id > 0 && typeof task.title === 'string' && typeof task.deadline === 'string' && typeof task.firstNoticed === 'string')) setLocalBackup(saved);
    } catch {}
  }, []);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(defaultDate(7));
  const [showDetails, setShowDetails] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editNote, setEditNote] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropId, setDropId] = useState<number | null>(null);
  const [sortNotice, setSortNotice] = useState("");

  const activeTasks = tasks.filter((task) => !task.archived);
  const archivedTasks = tasks.filter((task) => task.archived);

  const sortedTasks = useMemo(
    () =>
      [...activeTasks].sort((a, b) => {
        if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
        if (a.order !== undefined || b.order !== undefined) {
          return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
        }
        const statusDiff = statusStyle[getTaskStatus(a)].sort - statusStyle[getTaskStatus(b)].sort;
        if (statusDiff !== 0) return statusDiff;
        return daysUntil(a.deadline) - daysUntil(b.deadline);
      }),
    [activeTasks, today]
  );

  const unfinishedTasks = activeTasks.filter((task) => !task.completed);
  const selectedCount = unfinishedTasks.filter(task => bookingIds.includes(task.id)).length;
  const allSelected = unfinishedTasks.length > 0 && selectedCount === unfinishedTasks.length;
  const orderedUnfinished = sortedTasks.filter(task => !task.completed);

  async function moveTask(sourceId: number, targetId: number) {
    const ordered = orderedUnfinished.map(task => task.id);
    const from = ordered.indexOf(sourceId);
    const to = ordered.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    ordered.splice(from, 1);
    ordered.splice(to, 0, sourceId);
    try {
      const saved = await setTasks(current => current.map(task => {
        const order = ordered.indexOf(task.id);
        return order < 0 ? task : { ...task, order };
      }));
      if (!saved) return;
      setSortNotice(`已移至第 ${to + 1} 位，順序已儲存。`);
    } catch {
      setSortNotice("排序儲存失敗，請重試。");
    }
  }
  const overdueCount = unfinishedTasks.filter(task => getTaskStatus(task) === "overdue").length;
  const urgentCount = unfinishedTasks.filter(task => getTaskStatus(task) === "urgent").length;

  function toggleComplete(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
    if (editingId === taskId) setEditingId(null);
  }

  function archiveTask(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, archived: true } : task))
    );
    if (editingId === taskId) setEditingId(null);
  }

  function restoreTask(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, archived: false } : task))
    );
  }

  function deleteTask(taskId: number) {
    const task = tasks.find(item => item.id === taskId);
    if (!task || !window.confirm(`確定刪除「${task.title}」？`)) return;
    setBookingIds(current => current.filter(id => id !== taskId));
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (editingId === taskId) setEditingId(null);
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDeadline(task.deadline);
    setEditNote(task.note ?? "");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editTitle.trim()) return;

    const saved = await setTasks((current) =>
      current.map((task) =>
        task.id === editingId
          ? {
              ...task,
              title: editTitle.trim(),
              deadline: editDeadline,
              note: editNote.trim() || undefined
            }
          : task
      )
    );
    if (saved) setEditingId(null);
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const task: Task = {
      id: Date.now(),
      title: trimmedTitle,
      deadline,
      firstNoticed: localDate(),
      note: note.trim() || undefined
    };

    if (!await setTasks((current) => [task, ...current])) return;
    setTitle("");
    setNote("");
    setDeadline(defaultDate(7));
    setShowDetails(false);
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-border bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[62px] max-w-7xl flex-wrap items-center justify-between gap-3 px-[5%] py-3">
          <Logo />
          <nav aria-label="主要導覽" className="flex min-w-0 items-center gap-2 text-sm max-[640px]:w-full max-[640px]:overflow-x-auto max-[640px]:pb-1 [&>a]:shrink-0 [&>a]:whitespace-nowrap [&>a]:min-h-11">
            <Link className="rounded-full border border-border px-4 py-2 font-semibold text-muted no-underline hover:border-muted" href="/my-sessions">
              已預約場次
            </Link>
            <Link className="rounded-full border border-border px-4 py-2 font-semibold text-muted no-underline hover:border-muted" href="/sessions">
              可預約場次
            </Link>
            <Link className="rounded-full bg-terracotta-lt px-4 py-2 font-bold text-terracotta no-underline" href="/tasks">
              我的待辦清單
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-[5%] py-8 pb-40">
        <section className="mb-5">
          <div className="flex items-end justify-between gap-5 max-[760px]:block">
            <div>
              <h1 className="font-serif text-4xl font-black leading-tight tracking-normal">我的待辦清單</h1>
              <p className="mt-2 max-w-[620px] text-[.96rem] leading-[1.7] text-muted">
                把一直卡著的小事先放進來。預約場次時，可以直接從這裡挑今天要處理哪幾件。
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm max-[760px]:grid-cols-3">
              <div className="rounded-xl border border-border bg-white px-4 py-3">
                <div className="font-serif text-2xl font-black text-terracotta">{unfinishedTasks.length}</div>
                <div className="text-light">未完成</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-4 py-3">
                <div className="font-serif text-2xl font-black text-[#E24B4A]">{overdueCount}</div>
                <div className="text-light">已過期</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-4 py-3">
                <div className="font-serif text-2xl font-black text-terracotta">{urgentCount}</div>
                <div className="text-light">快到期</div>
                <div className="mt-1 text-[.68rem] leading-tight text-light">今天起 3 天內</div>
              </div>
            </div>
          </div>
        </section>

        <TaskSyncStatus />
        {localBackup.length > 0 ? <div className="mb-4 rounded-xl border border-border bg-white p-4 text-sm text-muted">
          這個瀏覽器還保留 {localBackup.length} 件舊待辦。確認是自己的資料後，可匯入目前帳號；同 ID 的雲端資料不會覆寫。
          <button type="button" disabled={taskSync.loading || taskSync.saving || !!taskSync.error || !taskSync.userId} className="ml-2 min-h-11 font-bold text-terracotta underline disabled:opacity-40" onClick={async () => {
            if (!window.confirm('確認將這個瀏覽器的舊待辦匯入目前登入的帳號？')) return;
            if (await setTasks(current => [...current, ...localBackup.filter(task => !current.some(existing => existing.id === task.id))])) setLocalBackup([]);
          }}>匯入舊待辦</button>
        </div> : null}
        <fieldset disabled={taskSync.loading || taskSync.saving || !!taskSync.error || !taskSync.userId} className="min-w-0 border-0 p-0 m-0">
        <form className="mb-5 rounded-2xl border-[1.5px] border-border bg-white p-4 shadow-soft" onSubmit={handleAddTask}>
          <div className="grid grid-cols-[minmax(0,1fr)_156px_112px] gap-3 max-[900px]:grid-cols-1">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-muted">事項</span>
              <input
                className="h-12 w-full rounded-xl border-[1.5px] border-border bg-cream px-4 text-base outline-none placeholder:text-light focus:border-terracotta"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="輸入一件想處理的事，例如：預約牙醫、補申報資料"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-muted">預計完成日</span>
              <input
                className="h-12 w-full rounded-xl border-[1.5px] border-border bg-cream px-3 text-sm outline-none focus:border-terracotta"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                aria-label="預計完成日"
              />
            </label>
            <div className="block">
              <span className="mb-1 block text-xs font-bold text-transparent">加入</span>
              <button className="h-12 w-full rounded-xl bg-terracotta px-6 text-base font-bold text-white transition-colors hover:bg-terracotta-d" type="submit">
                加入
              </button>
            </div>
          </div>

          {showDetails ? (
            <div className="mt-3">
              <input
                className="min-h-11 w-full rounded-xl border-[1.5px] border-border bg-cream px-3 text-sm outline-none focus:border-terracotta"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="備註或第一步，不填也可以"
              />
            </div>
          ) : null}

          <button
            className="mt-3 inline-flex items-center gap-1 rounded-full px-1 text-sm font-bold text-muted underline-offset-4 hover:text-ink hover:underline"
            type="button"
            onClick={() => setShowDetails((current) => !current)}
          >
            <span>{showDetails ? "−" : "+"}</span>
            {showDetails ? "收起補充細節" : "補充細節"}
          </button>
        </form>

        {bookingIds.some(id => unfinishedTasks.some(t => t.id === id)) ? (
          <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(760px,94vw)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-lift" role="region" aria-label="已選待辦操作">
            <span className="text-sm font-bold">已選 {bookingIds.filter(id => unfinishedTasks.some(t => t.id === id)).length} 件</span>
            <button type="button" className="rounded-full bg-forest px-4 py-2 text-sm font-bold text-white" onClick={async () => {
              const ids = bookingIds.filter(id => unfinishedTasks.some(t => t.id === id));
              if (!await setTasks(current => current.map(task => ids.includes(task.id) ? { ...task, completed: true } : task))) return;
              setUndoIds(ids); setBookingIds([]);
            }}>標記完成</button>
            <button type="button" className="rounded-full bg-terracotta px-4 py-2 text-sm font-bold text-white" onClick={() => {
              const ids = bookingIds.filter(id => unfinishedTasks.some(t => t.id === id));
              router.push('/sessions?tasks=' + ids.join(','));
            }}>選擇場次（已選 {bookingIds.filter(id => unfinishedTasks.some(t => t.id === id)).length} 件）</button>
            <button type="button" className="px-3 py-2 text-sm text-muted" onClick={() => setBookingIds([])}>取消選取</button>
          </div>
        ) : null}
        {undoIds.length > 0 ? <div role="status" className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-ink px-5 py-3 text-sm text-white">
          已完成 {undoIds.length} 件
          <button type="button" className="font-bold underline" onClick={async () => {
            if (!await setTasks(current => current.map(task => undoIds.includes(task.id) ? { ...task, completed: false } : task))) return;
            setUndoIds([]);
          }}>復原</button>
        </div> : null}
        <p className="mb-3 text-sm text-muted">勾選事項後，可批次標記完成或選擇場次。拖曳左側把手調整順序。</p>
        <p role="status" className="sr-only">{sortNotice}</p>
        <section className="rounded-2xl border-[1.5px] border-border bg-white shadow-soft">
          <div className="grid grid-cols-[24px_44px_76px_minmax(0,1fr)_120px_76px_96px] items-center gap-3 rounded-t-2xl border-l-4 border-l-transparent border-b border-border bg-cream-d px-4 py-3 text-xs font-bold uppercase tracking-normal text-muted max-[900px]:grid-cols-[24px_44px_minmax(0,1fr)_auto] max-[900px]:gap-2">
            <div />
            <label className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 text-xs font-bold text-muted">
          <input
            type="checkbox"
            className="size-5 cursor-pointer accent-forest disabled:cursor-default"
            checked={allSelected}
            ref={element => {
              if (element) element.indeterminate = selectedCount > 0 && !allSelected;
            }}
            disabled={unfinishedTasks.length === 0}
            onChange={() => setBookingIds(allSelected ? [] : unfinishedTasks.map(task => task.id))}
          />
          <span>全選</span>
        </label>
            <div className="text-center max-[900px]:hidden">提醒</div>
            <div>事項</div>
            <div className="max-[900px]:hidden">預計完成</div>
            <div className="max-[900px]:hidden">已放著</div>
            <div />
          </div>

          <div className="divide-y divide-border">
            {!taskSync.loading && !taskSync.error && tasks.length === 0 ? <p className="p-6 text-sm text-muted">還沒有待辦，先新增一件想完成的事。</p> : null}
            {sortedTasks.map((task) => {
              const delayed = daysBetween(task.firstNoticed);
              const status = statusStyle[getTaskStatus(task)];
              const isEditing = editingId === task.id;

              return (
                <article
                  onDragOver={event => {
                    if (!taskSync.saving && !taskSync.loading && !taskSync.error && draggedId !== null && !task.completed && !isEditing) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropId(task.id);
                    }
                  }}
                  onDrop={event => {
                    event.preventDefault();
                    if (!taskSync.saving && !taskSync.loading && !taskSync.error && draggedId !== null && !task.completed && !isEditing) moveTask(draggedId, task.id);
                    setDraggedId(null); setDropId(null);
                  }}
                  className={`border-l-4 px-4 py-3 transition-colors hover:bg-cream/70 ${dropId === task.id ? "ring-2 ring-inset ring-terracotta" : ""} ${draggedId === task.id ? "opacity-50" : ""} ${
                    task.completed ? "border-l-forest bg-forest-lt/45" : `bg-white ${status.rowClass}`
                  }`}
                  key={task.id}
                >
                  {isEditing ? (
                    <form className="grid grid-cols-[minmax(0,1fr)_150px_auto] gap-3 max-[900px]:grid-cols-1" onSubmit={saveEdit}>
                      <input
                        className="min-h-11 rounded-xl border-[1.5px] border-border bg-cream px-3 text-sm outline-none focus:border-terracotta"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                      <input
                        className="min-h-11 rounded-xl border-[1.5px] border-border bg-cream px-3 text-sm outline-none focus:border-terracotta"
                        type="date"
                        value={editDeadline}
                        onChange={(event) => setEditDeadline(event.target.value)}
                        aria-label="修改預計完成日"
                      />
                      <div className="flex gap-2">
                        <button className="rounded-full bg-terracotta px-4 text-sm font-bold text-white hover:bg-terracotta-d" type="submit">
                          儲存
                        </button>
                        <button className="rounded-full border border-border px-4 text-sm font-bold text-muted hover:border-muted" type="button" onClick={() => setEditingId(null)}>
                          取消
                        </button>
                      </div>
                      <input
                        className="col-span-2 min-h-11 rounded-xl border-[1.5px] border-border bg-cream px-3 text-sm outline-none focus:border-terracotta max-[900px]:col-span-1"
                        value={editNote}
                        onChange={(event) => setEditNote(event.target.value)}
                        placeholder="備註"
                      />
                    </form>
                  ) : (
                    <div className="grid min-h-[58px] grid-cols-[24px_44px_76px_minmax(0,1fr)_120px_76px_96px] items-center gap-3 max-[900px]:grid-cols-[24px_44px_minmax(0,1fr)_auto] max-[900px]:gap-2">
                      {!task.completed ? (
                        <button type="button" draggable aria-label={`拖曳排序：${task.title}，可用鍵盤上下鍵調整`} title="拖曳調整順序"
                          className="flex h-10 w-6 cursor-grab items-center justify-center rounded text-xl text-light hover:text-muted focus-visible:outline-terracotta active:cursor-grabbing"
                          onDragStart={event => { setDraggedId(task.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(task.id)); }}
                          onDragEnd={() => { setDraggedId(null); setDropId(null); }}
                          onKeyDown={event => {
                            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                            event.preventDefault();
                            const index = orderedUnfinished.findIndex(item => item.id === task.id);
                            const target = orderedUnfinished[index + (event.key === "ArrowUp" ? -1 : 1)];
                            if (target) moveTask(task.id, target.id);
                          }}>⠿</button>
                      ) : <div />}
                      <label className="flex min-h-11 cursor-pointer items-center justify-center text-xs text-muted">
                        <input type="checkbox" className="size-5 cursor-pointer accent-forest"
                          disabled={!!task.completed}
                          checked={!task.completed && bookingIds.includes(task.id)} onChange={() => setBookingIds(current => current.includes(task.id) ? current.filter(id => id !== task.id) : [...current, task.id])}
                          aria-label={`選取 ${task.title}`} />
                      </label>
                      <div className="max-[900px]:hidden">
                        <span className={`inline-flex min-w-[62px] justify-center rounded px-2 py-1 text-xs font-bold ${task.completed ? "bg-forest text-white" : status.className}`}>
                          {task.completed ? "已完成" : status.label}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`break-words text-[.95rem] font-bold leading-relaxed ${task.completed ? "text-forest line-through" : ""}`}
                          title={task.title}
                        >
                          <span className={`mr-2 hidden rounded px-1.5 py-0.5 text-[.68rem] font-bold max-[900px]:inline-flex ${task.completed ? "bg-forest text-white" : status.className}`}>
                            {task.completed ? "已完成" : status.label}
                          </span>
                          {task.title}
                        </div>
                        <TaskSessionBadge taskId={task.id} />
                        {!task.completed && task.note ? (
                          <div
                            className="mt-0.5 truncate text-xs leading-relaxed text-light"
                            title={task.note}
                          >
                            {task.note}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-muted max-[900px]:col-start-3">
                        {task.completed ? "完成" : task.deadline ? (
                          <>
                            <time dateTime={task.deadline}>{task.deadline.replaceAll("-", "/")}</time>
                            <div className="mt-1 text-xs font-normal text-light">{formatDeadline(task.deadline)}</div>
                          </>
                        ) : "未設定期限"}
                      </div>
                      <div className="text-sm font-normal text-muted max-[900px]:hidden">
                        {task.completed ? "—" : `${delayed} 天`}
                      </div>
                      <div className="flex flex-wrap justify-end gap-1 max-[900px]:col-span-4 max-[900px]:justify-end">
                        {task.completed ? (
                          <>
                          <button type="button" className="px-2 text-xs text-muted underline" onClick={() => toggleComplete(task.id)}>取消完成</button>
                          <button
                            className="rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-forest/90"
                            type="button"
                            onClick={() => archiveTask(task.id)}
                          >
                            封存
                          </button>
                          </>
                        ) : (
                          <button
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream hover:text-ink focus-visible:outline-terracotta"
                            type="button"
                            aria-label={`編輯 ${task.title}`} title="編輯"
                            onClick={() => startEditing(task)}
                          >
                            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z M13 6l5 5" /></svg>
                          </button>
                        )}
                        <button
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#FCEBEB] hover:text-[#E24B4A] focus-visible:outline-terracotta"
                          type="button"
                          aria-label={`刪除 ${task.title}`} title="刪除"
                          onClick={() => deleteTask(task.id)}
                        >
                          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border-[1.5px] border-border bg-white">
          <button
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-muted"
            type="button"
            onClick={() => setShowArchive((current) => !current)}
          >
            <span>已完成 / 封存 ({archivedTasks.length})</span>
            <span>{showArchive ? "收起" : "展開"}</span>
          </button>
          {showArchive ? (
            <div className="divide-y divide-border border-t border-border">
              {archivedTasks.length ? (
                archivedTasks.map((task) => (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-light" key={task.id}>
                    <div className="min-w-0">
                      <div className="truncate font-semibold line-through" title={task.title}>{task.title}</div>
                      <div className="text-xs">完成後已封存</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted hover:border-muted hover:text-ink"
                        type="button"
                        onClick={() => restoreTask(task.id)}
                      >
                        還原
                      </button>
                      <button
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted hover:border-[#E24B4A] hover:text-[#E24B4A]"
                        type="button"
                        aria-label={`刪除 ${task.title}`} title="刪除"
                          onClick={() => deleteTask(task.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-light">還沒有封存的待辦事項。</div>
              )}
            </div>
          ) : null}
        </section>
        </fieldset>
      </div>
    </main>
  );
}
