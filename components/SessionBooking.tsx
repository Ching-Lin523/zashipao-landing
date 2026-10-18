"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSharedTasks } from "./useSharedTasks";
import { saveBooking } from "./bookingStore";
import { TaskSyncStatus } from "./TaskSyncStatus";
import { Logo } from "./Logo";

type Priority = "now" | "soon" | "quick" | "later" | "split";
type BookingStep = "sessions" | "commitment";

type Session = {
  id: string;
  time: string;
  endTime: string;
  day: string;
  title: string;
  spots: string;
  status: "open" | "live" | "almost";
};

type SessionTemplate = {
  id: string;
  time: string;
  endTime: string;
  title: string;
  status: "open" | "live" | "almost";
};

type BookableTask = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  deadline: string;
  source: "list" | "adHoc";
};

type SessionBookingProps = {
  initialStep?: BookingStep;
};

const sessionTemplates: SessionTemplate[] = [
  {
    id: "evening-21",
    time: "21:00",
    endTime: "21:50",
    title: "晚間雜事衝刺",
    status: "open"
  },
  {
    id: "night-22",
    time: "22:00",
    endTime: "22:50",
    title: "睡前清空場",
    status: "open"
  },
  {
    id: "morning-07",
    time: "07:00",
    endTime: "07:50",
    title: "出門前做一件事",
    status: "almost"
  },
  {
    id: "lunch-12",
    time: "12:00",
    endTime: "12:50",
    title: "午休雜事場",
    status: "open"
  }
];

const weekdayFormatter = new Intl.DateTimeFormat("zh-TW", { weekday: "short" });

function getDateFilterLabel(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdayFormatter.format(date);
  const prefix = offset === 0 ? "今天" : offset === 1 ? "明天" : weekday;

  return `${prefix} ${month}/${day}`;
}

function getSpots(templateIndex: number, dateOffset: number) {
  const taken = ((templateIndex + dateOffset * 2) % 4) + 1;
  return `${taken} / 5 人`;
}

const priorityStyle: Record<Priority, { label: string; className: string; sort: number }> = {
  now: { label: "快到期", className: "bg-terracotta-lt text-terracotta", sort: 1 },
  soon: { label: "快到期", className: "bg-terracotta-lt text-terracotta", sort: 1 },
  split: { label: "拖很久", className: "bg-lavender-lt text-lavender", sort: 2 },
  quick: { label: "一般", className: "bg-cream-dd text-muted", sort: 3 },
  later: { label: "一般", className: "bg-cream-dd text-muted", sort: 3 }
};

const statusCopy = {
  open: "可預約",
  live: "進行中",
  almost: "快滿"
};

export function SessionBooking({ initialStep = "sessions" }: SessionBookingProps) {
  const [step, setStep] = useState<BookingStep>(initialStep);
  const [selectedSessionId, setSelectedSessionId] = useState(`${sessionTemplates[0].id}-0`);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [sharedTasks, setSharedTasks] = useSharedTasks();
  const tasks: BookableTask[] = sharedTasks.filter(task => !task.completed && !task.archived).map(task => ({
    id: task.id, title: task.title, category: "待辦", deadline: task.deadline,
    priority: "quick", source: "list"
  }));
  const [bookingError, setBookingError] = useState("");
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("tasks");
    if (selected !== null) setSelectedTaskIds([...new Set(selected.split(",").map(Number).filter(Number.isSafeInteger))]);
  }, []);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [adHocTitle, setAdHocTitle] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const dateFilters = useMemo(
    () => Array.from({ length: 14 }, (_, offset) => ({ id: offset, label: getDateFilterLabel(offset) })),
    []
  );
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => priorityStyle[a.priority].sort - priorityStyle[b.priority].sort),
    [tasks]
  );
  const visibleSessions = useMemo(
    () =>
      sessionTemplates.map((session, index) => ({
        ...session,
        id: `${session.id}-${selectedDateOffset}`,
        day: getDateFilterLabel(selectedDateOffset),
        spots: getSpots(index, selectedDateOffset)
      })),
    [selectedDateOffset]
  );
  const selectedSession = visibleSessions.find((session) => session.id === selectedSessionId) ?? visibleSessions[0];
  const selectedTasks = tasks.filter((task) => selectedTaskIds.includes(task.id));
  const hardTaskSelected = selectedTasks.some((task) => task.priority === "split");
  const selectionFeelsHeavy = selectedTasks.length > 3 || (hardTaskSelected && selectedTasks.length > 1);

  function toggleTask(taskId: number) {
    setConfirmed(false);
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  }

  function chooseSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setConfirmed(false);
    setStep("commitment");
  }

async function addAdHocTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = adHocTitle.trim();
    if (!trimmedTitle) return;

    const task: BookableTask = {
      id: Date.now(),
      title: trimmedTitle,
      category: "臨時事項",
      priority: "quick",
      deadline: "2026-05-17",
      source: "adHoc"
    };

    if (!await setSharedTasks(current => [{ id: task.id, title: task.title, deadline: "", firstNoticed: new Date().toISOString().slice(0, 10) }, ...current])) return;
    setSelectedTaskIds((current) => [task.id, ...current]);
    setAdHocTitle("");
    setConfirmed(false);
  }

  function getGoogleCalendarUrl() {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() + selectedDateOffset);
    const [startHour, startMinute] = selectedSession.time.split(":").map(Number);
    const [endHour, endMinute] = selectedSession.endTime.split(":").map(Number);
    const start = new Date(sessionDate);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(sessionDate);
    end.setHours(endHour, endMinute, 0, 0);
    const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const details = selectedTasks.map((task) => `- ${task.title}`).join("\n");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `雜事房：${selectedSession.title}`
    )}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(`本場想完成：\n${details}`)}`;
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-border bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-7xl items-center justify-between px-[5%]">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link className="rounded-full border border-border px-4 py-2 font-semibold text-muted no-underline hover:border-muted" href="/my-sessions">
              已預約場次
            </Link>
            <Link className="rounded-full bg-terracotta-lt px-4 py-2 font-bold text-terracotta no-underline" href="/sessions">
              可預約場次
            </Link>
            <Link className="rounded-full border border-border px-4 py-2 font-semibold text-muted no-underline hover:border-muted" href="/tasks">
              我的待辦清單
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-[5%] py-8">
        <TaskSyncStatus />
        <div className="mb-6 flex gap-2 text-sm">
          <span className={`rounded-full px-3 py-1.5 font-bold ${step === "sessions" ? "bg-terracotta text-white" : "bg-terracotta-lt text-terracotta"}`}>
            1 選場次
          </span>
          <span className={`rounded-full px-3 py-1.5 font-bold ${step === "commitment" ? "bg-terracotta text-white" : "bg-cream-d text-muted"}`}>
            2 選這場要做什麼
          </span>
        </div>

        {step === "sessions" ? (
          <>
            <section className="mb-6">
              {selectedTasks.length > 0 ? <p className="mb-3 rounded-xl bg-forest-lt p-3 text-sm text-forest">已帶入 {selectedTasks.length} 件待辦，選好時段後可再次確認。</p> : null}
              <div>
                <h1 className="font-serif text-4xl font-black leading-tight tracking-normal">先選你要出現的時間</h1>
                <p className="mt-2 max-w-[650px] text-[.96rem] leading-[1.7] text-muted">
                  每房最多 5 人。先挑一個你願意出現的時段，選好後，再決定這場要處理哪件雜事。
                </p>
              </div>
            </section>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {dateFilters.map((filter) => (
                <button
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    selectedDateOffset === filter.id
                      ? "border-terracotta bg-terracotta text-white"
                      : "border-border bg-white text-muted hover:border-muted"
                  }`}
                  type="button"
                  onClick={() => {
                    setSelectedDateOffset(filter.id);
                    setConfirmed(false);
                  }}
                  key={filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <section className="grid gap-3">
              {visibleSessions.map((session) => (
                <article className="rounded-2xl border-[1.5px] border-border bg-white p-5 transition-all hover:border-terracotta hover:shadow-soft" key={session.id}>
                  <div className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-4 max-[640px]:grid-cols-[68px_minmax(0,1fr)]">
                    <div className="text-center">
                      <div className="font-serif text-2xl font-black leading-none text-ink">{session.time}</div>
                      <div className="mt-1 text-xs text-light">{session.day}</div>
                      <div className="mt-1 text-xs font-semibold text-muted">到 {session.endTime}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold">{session.title}</h2>
                        <span className="rounded bg-forest-lt px-2 py-0.5 text-xs font-bold text-forest">{statusCopy[session.status]}</span>
                      </div>
                      <p className="text-sm leading-[1.5] text-muted">進場後再選這場要處理的事，各式各樣的生活雜事都可以。</p>
                    </div>
                    <div className="text-right max-[640px]:col-span-2 max-[640px]:text-left">
                      <div className="mb-3 text-sm font-bold text-muted">{session.spots}</div>
                      <button
                        className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-bold text-white hover:bg-terracotta-d"
                        type="button"
                        onClick={() => chooseSession(session.id)}
                      >
                        選這場
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-[960px]:grid-cols-1">
            <div>
              <button className="mb-5 text-sm font-bold text-muted hover:text-ink" type="button" onClick={() => setStep("sessions")}>
                ← 換一個場次
              </button>
              <div className="mb-5 rounded-2xl border-[1.5px] border-terracotta bg-white p-5 shadow-soft">
                <div className="mb-1 text-xs font-bold uppercase tracking-[.1em] text-terracotta">
                  {selectedSession.day} {selectedSession.time} - {selectedSession.endTime}
                </div>
                <h1 className="font-serif text-3xl font-black leading-tight tracking-normal">這場要處理什麼？</h1>
                <p className="mt-2 text-sm leading-[1.7] text-muted">
                  輸入這場想完成的事。
                </p>
              </div>

              <form className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border-[1.5px] border-border bg-white p-3" onSubmit={addAdHocTask}>
                <input
                  className="min-h-11 rounded-xl border-[1.5px] border-border bg-cream px-4 text-sm outline-none placeholder:text-light focus:border-terracotta"
                  value={adHocTitle}
                  onChange={(event) => setAdHocTitle(event.target.value)}
                  placeholder="輸入這場想完成的事，例如：回覆房東、取消訂閱、預約牙醫"
                />
                <button className="rounded-full bg-terracotta px-5 text-sm font-bold text-white hover:bg-terracotta-d" type="submit">
                  加到本場
                </button>
              </form>

              <div className="grid gap-2">
                <div className="mb-1 text-sm font-bold text-muted">或從我的待辦清單選</div>
                {sortedTasks.map((task) => {
                  const checked = selectedTaskIds.includes(task.id);
                  const priority = priorityStyle[task.priority];

                  return (
                    <button
                      className={`grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-xl border p-3 text-left transition-colors ${
                        checked ? "border-terracotta bg-terracotta-lt/40" : "border-border bg-white hover:border-border-d"
                      }`}
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      key={task.id}
                    >
                      <span
                        className={`mt-0.5 flex size-5 items-center justify-center rounded-md border text-xs font-black ${
                          checked ? "border-terracotta bg-terracotta text-white" : "border-border bg-cream text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className="mb-1 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[.68rem] font-bold ${priority.className}`}>{priority.label}</span>
                          <span className="text-xs text-light">預計完成 {task.deadline.slice(5).replace("-", "/")}</span>
                          {task.source === "adHoc" ? <span className="rounded bg-cream-dd px-1.5 py-0.5 text-[.68rem] font-bold text-muted">臨時</span> : null}
                        </span>
                        <span className="block truncate text-sm font-bold">{task.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-lift">
              <div className="mb-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-[.1em] text-terracotta">本場承諾</div>
                <h2 className="font-serif text-2xl font-black">{selectedTasks.length} 件雜事</h2>
              </div>

              <div className="mb-4 grid gap-2">
                {selectedTasks.length ? (
                  selectedTasks.map((task) => (
                    <div className="rounded-xl border border-border bg-cream p-3" key={task.id}>
                      <div className="text-sm font-bold">{task.title}</div>
                      <div className="mt-1 text-xs text-light">
                        {priorityStyle[task.priority].label} · 預計完成 {task.deadline.slice(5).replace("-", "/")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-cream p-4 text-sm text-muted">
                    還沒選。至少放一件事進來，這場才有明確目標。
                  </div>
                )}
              </div>

              {selectionFeelsHeavy ? (
                <div className="mb-4 rounded-xl border border-[#E24B4A]/20 bg-[#FCEBEB] p-3 text-sm leading-[1.6] text-[#B63C3C]">
                  這場內容有點多。建議先保留最想推進的一到三件。
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-forest/20 bg-forest-lt p-3 text-sm leading-[1.6] text-forest">
                  系統會把這些事項記在本場預約裡。預約後，可隨時到「已預約場次」編輯待辦事項。
                </div>
              )}

              {bookingError ? <p role="alert" className="mb-3 text-sm text-terracotta">{bookingError}</p> : null}
              <button
                className="w-full rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-px hover:bg-terracotta-d disabled:cursor-not-allowed disabled:bg-light"
                disabled={!selectedTasks.length}
                type="button"
                onClick={() => {
                  try {
                    const date = new Date(); date.setDate(date.getDate() + selectedDateOffset);
                    const day = date.getFullYear() + "/" + String(date.getMonth()+1).padStart(2,"0") + "/" + String(date.getDate()).padStart(2,"0") + "（" + weekdayFormatter.format(date) + "）";
                    saveBooking({ id: "booking-" + day.slice(0,10).replaceAll("/", "-") + "-" + selectedSession.time.replace(":", ""), title: selectedSession.title, date: day, time: selectedSession.time + " - " + selectedSession.endTime, taskIds: selectedTasks.map(t => t.id), tasks: selectedTasks.map(t => t.title), status: "尚未開放", canEnterWaiting: false });
                    setBookingError(""); setConfirmed(true);
                  } catch { setBookingError("無法儲存預約，請確認瀏覽器允許本機儲存後重試。"); }
                }}
              >
                確認預約
              </button>

            </aside>
          </section>
        )}
      </div>

      {confirmed ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
          <div className="w-full max-w-[440px] rounded-2xl border-[1.5px] border-border bg-white p-6 shadow-lift">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-forest-lt text-xl font-black text-forest">✓</div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-terracotta">預約完成</div>
            <h2 className="mb-2 font-serif text-3xl font-black leading-tight tracking-normal">
              {selectedSession.day} {selectedSession.time} - {selectedSession.endTime}
            </h2>
            <p className="mb-4 text-sm leading-[1.7] text-muted">
              這場會帶著 {selectedTasks.length} 件雜事進場。預約後，可隨時到「已預約場次」編輯待辦事項。
            </p>
            <div className="mb-5 grid gap-2">
              {selectedTasks.map((task) => (
                <div className="rounded-xl bg-cream px-3 py-2 text-sm font-semibold" key={task.id}>
                  {task.title}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                className="flex-1 rounded-full bg-terracotta px-4 py-3 text-center text-sm font-bold text-white no-underline hover:bg-terracotta-d"
                href="/my-sessions"
              >
                查看已預約場次
              </Link>
              <Link
                className="flex-1 rounded-full border border-border px-4 py-3 text-center text-sm font-bold text-muted no-underline hover:border-muted hover:text-ink"
                href="/tasks"
              >
                整理我的待辦清單
              </Link>
            </div>
            <a className="mt-3 block text-center text-sm font-bold text-light no-underline hover:text-muted" href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer">
              加到 Google 行事曆
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}
