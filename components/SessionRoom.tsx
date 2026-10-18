"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Logo } from "./Logo";

type RoomTask = {
  id: number;
  title: string;
  category: string;
  done: boolean;
};

type Panel = "tasks" | "chat" | "stats";

type ChatMessage = {
  id: number;
  author: string;
  text: string;
  mine?: boolean;
  system?: boolean;
};

type Participant = {
  name: string;
  task: string;
  color: string;
  me?: boolean;
  speaking?: boolean;
  muted?: boolean;
  done?: boolean;
};

const initialTasks: RoomTask[] = [
  { id: 1, title: "補齊所得稅延期申報資料", category: "財務", done: false },
  { id: 2, title: "預約牙醫洗牙", category: "健康醫療", done: false },
  { id: 3, title: "回覆房東確認冷氣維修時間", category: "臨時事項", done: false }
];

const participants: Participant[] = [
  { name: "你", task: "補齊所得稅資料", color: "bg-terracotta-lt text-terracotta", me: true, speaking: false },
  { name: "芯", task: "更新護照照片預約", color: "bg-forest-lt text-forest", speaking: true },
  { name: "岳", task: "整理健保卡與保單", color: "bg-lavender-lt text-lavender", muted: true },
  { name: "婷", task: "繳交國民年金", color: "bg-amberish-lt text-amberish", done: true },
  { name: "威", task: "回覆房東續約信", color: "bg-cream-dd text-muted" }
];

const initialMessages: ChatMessage[] = [
  { id: 1, author: "system", text: "場次已開始，大家加油。", system: true },
  { id: 2, author: "芯", text: "護照系統有點慢，先把表填好了。" },
  { id: 3, author: "婷", text: "我繳完了，比想像快很多。" },
  { id: 4, author: "我", text: "找到申報資料了，正在補表格。", mine: true }
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionRoom() {
  const [tasks, setTasks] = useState(initialTasks);
  const [panel, setPanel] = useState<Panel>("tasks");
  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(50 * 60);

  const completedCount = tasks.filter((task) => task.done).length;
  const remainingCount = tasks.length - completedCount;
  const progress = useMemo(() => Math.round((completedCount / tasks.length) * 100), [completedCount, tasks.length]);

  useEffect(() => {
    if (!started || ended) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, ended]);

  function toggleTask(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    );
  }

  function sendMessage(event?: FormEvent<HTMLFormElement>, quickText?: string) {
    event?.preventDefault();
    const text = (quickText ?? messageText).trim();
    if (!text) return;

    setMessages((current) => [...current, { id: Date.now(), author: "我", text, mine: true }]);
    setMessageText("");
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#16110E] text-white">
      <header className="z-40 border-b border-white/10 bg-[#16110E]/95 backdrop-blur-xl">
        <div className="flex h-[58px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4">
            <Logo dark />
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="font-serif text-sm font-bold">晚間雜事衝刺 #3</div>
              <div className="mt-0.5 text-xs text-white/45">2026/05/17（週日）21:00 - 21:50 · {participants.length} / 5 人</div>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-forest/35 bg-forest/25 px-3 py-1 text-xs font-bold text-[#7EDBB8] sm:flex">
              <span className="size-1.5 animate-blink rounded-full bg-current" />
              {started ? "專注工作中" : "等待開始"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 font-mono text-lg font-bold tracking-normal">
              {formatTime(secondsLeft)}
            </div>
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white/60 hover:border-[#ff8888]/60 hover:text-[#ff8888]"
              type="button"
              onClick={() => setEnded(true)}
            >
              離開
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 max-[980px]:flex-col">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-auto p-4 max-[1180px]:grid-cols-2 max-[640px]:grid-cols-1">
            {participants.map((participant, index) => (
              <div
                className={`relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-2xl border bg-white/[.06] ${
                  participant.speaking ? "border-terracotta shadow-[0_0_0_3px_rgba(196,96,58,.25)]" : participant.me ? "border-terracotta/50" : "border-white/10"
                }`}
                key={participant.name}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.08),transparent_32%),linear-gradient(145deg,#2A1F1A,#17100D)]" />
                {participant.done ? (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-forest/70 px-2 py-1 text-xs font-bold text-[#7EDBB8]">✓ 已完成</div>
                ) : null}
                <div className="absolute right-3 top-3 z-10 flex gap-1">
                  <span className={`rounded-md px-2 py-1 text-xs ${participant.muted ? "bg-[#C13B3B]/40" : "bg-black/45"}`}>
                    {participant.muted ? "靜音" : "在線"}
                  </span>
                </div>
                <div className="relative z-10 text-center">
                  <div className={`mx-auto mb-3 flex size-16 items-center justify-center rounded-full text-xl font-black ${participant.color}`}>
                    {participant.name}
                  </div>
                  <div className="font-bold">{participant.me ? "你" : `${participant.name} 的雜事時間`}</div>
                  <div className="mt-1 text-xs text-white/45">{participant.task}</div>
                </div>
              </div>
            ))}

            {participants.length < 5 ? <button
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[.025] text-white/40 hover:border-terracotta/60 hover:bg-terracotta/10 hover:text-white"
              type="button"
            >
              <span className="text-3xl">＋</span>
              <span className="mt-2 text-sm font-bold">空位 · 邀請朋友</span>
            </button> : null}
          </div>

          <div className="relative flex h-[72px] shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#16110E]/95 px-5">
            <div className="absolute left-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/50 max-[760px]:hidden">
              <span>進度</span>
              <div className="flex gap-1">
                {tasks.map((task) => (
                  <span className={`h-1 w-7 rounded ${task.done ? "bg-forest" : "bg-white/15"}`} key={task.id} />
                ))}
              </div>
              <span>{completedCount}/{tasks.length}</span>
            </div>

            <button
              className={`flex h-[52px] w-[58px] flex-col items-center justify-center rounded-xl border text-xs font-bold ${
                micOn ? "border-white/15 bg-white/10 text-white" : "border-[#C13B3B]/50 bg-[#C13B3B]/25 text-[#ff8888]"
              }`}
              type="button"
              onClick={() => setMicOn((current) => !current)}
            >
              <span className="text-lg">{micOn ? "🎤" : "🔇"}</span>
              <span>{micOn ? "靜音" : "開麥"}</span>
            </button>
            <button
              className={`flex h-[52px] w-[58px] flex-col items-center justify-center rounded-xl border text-xs font-bold ${
                cameraOn ? "border-white/15 bg-white/10 text-white" : "border-terracotta/40 bg-terracotta/20 text-terracotta"
              }`}
              type="button"
              onClick={() => setCameraOn((current) => !current)}
            >
              <span className="text-lg">📹</span>
              <span>{cameraOn ? "關鏡頭" : "開鏡頭"}</span>
            </button>
            <button
              className={`flex h-[52px] w-[58px] flex-col items-center justify-center rounded-xl border text-xs font-bold ${
                sharing ? "border-terracotta/40 bg-terracotta/20 text-terracotta" : "border-white/15 bg-white/10 text-white"
              }`}
              type="button"
              onClick={() => setSharing((current) => !current)}
            >
              <span className="text-lg">🖥</span>
              <span>分享</span>
            </button>
            <button className="flex h-[52px] w-[58px] flex-col items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-bold text-white" type="button">
              <span className="text-lg">🎉</span>
              <span>反應</span>
            </button>

            <div className="absolute right-5 max-[760px]:hidden">
              {!started ? (
                <button className="rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white hover:bg-terracotta-d" type="button" onClick={() => setStarted(true)}>
                  開始場次
                </button>
              ) : (
                <button className="rounded-full bg-[#C13B3B]/30 px-5 py-3 text-sm font-bold text-[#ff9999] hover:bg-[#C13B3B]/45" type="button" onClick={() => setEnded(true)}>
                  結束場次
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-cream text-ink max-[980px]:h-[520px] max-[980px]:w-full">
          <div className="grid grid-cols-3 border-b border-border bg-white">
            {[
              ["tasks", "任務"],
              ["chat", "聊天"],
              ["stats", "統計"]
            ].map(([id, label]) => (
              <button
                className={`border-b-2 px-3 py-3 text-sm font-bold ${
                  panel === id ? "border-terracotta text-terracotta" : "border-transparent text-light hover:text-muted"
                }`}
                type="button"
                onClick={() => setPanel(id as Panel)}
                key={id}
              >
                {label}
              </button>
            ))}
          </div>

          {panel === "tasks" ? (
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mb-5">
                <div className="mb-1 text-xs font-bold uppercase tracking-[.1em] text-terracotta">本場承諾</div>
                <h2 className="font-serif text-2xl font-black">{completedCount} / {tasks.length} 已完成</h2>
                <div className="mt-3 h-2 overflow-hidden rounded bg-cream-d">
                  <div className="h-full rounded bg-forest transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mb-5 grid gap-2">
                {tasks.map((task) => (
                  <button
                    className={`grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-xl border p-3 text-left transition-colors ${
                      task.done ? "border-forest/30 bg-forest-lt" : "border-border bg-white hover:border-border-d"
                    }`}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    key={task.id}
                  >
                    <span
                      className={`mt-0.5 flex size-5 items-center justify-center rounded-md border text-xs font-black ${
                        task.done ? "border-forest bg-forest text-white" : "border-border bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-bold ${task.done ? "text-forest line-through" : "text-ink"}`}>{task.title}</span>
                      <span className="mt-1 block text-xs text-light">{task.category}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-cream p-3 text-sm leading-[1.6] text-muted">
                場次結束時，做完的會標記完成；還沒做完的會留在我的待辦清單。
              </div>
            </div>
          ) : null}

          {panel === "chat" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
                {messages.map((message) =>
                  message.system ? (
                    <div className="text-center" key={message.id}>
                      <span className="rounded-full bg-cream-d px-3 py-1 text-xs text-light">{message.text}</span>
                    </div>
                  ) : (
                    <div className={`flex ${message.mine ? "justify-end" : "justify-start"}`} key={message.id}>
                      <div className={`max-w-[78%] rounded-xl px-3 py-2 text-sm leading-[1.5] ${message.mine ? "bg-terracotta-lt" : "bg-white border border-border"}`}>
                        <div className="mb-1 text-xs font-bold text-muted">{message.author}</div>
                        {message.text}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-border bg-white p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["加油", "完成了", "還在搞", "👍"].map((quick) => (
                    <button className="rounded-full bg-cream-d px-3 py-1 text-xs font-bold text-muted hover:bg-cream-dd" type="button" onClick={() => sendMessage(undefined, quick)} key={quick}>
                      {quick}
                    </button>
                  ))}
                </div>
                <form className="grid grid-cols-[minmax(0,1fr)_34px] gap-2" onSubmit={sendMessage}>
                  <input
                    className="rounded-lg border-[1.5px] border-border bg-cream px-3 py-2 text-sm outline-none focus:border-terracotta"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="說點什麼..."
                  />
                  <button className="rounded-lg bg-terracotta text-sm font-black text-white" type="submit">
                    ↑
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {panel === "stats" ? (
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mb-3 rounded-xl border border-border bg-white p-4 text-center">
                <div className="text-3xl">🔥</div>
                <div className="font-serif text-4xl font-black text-terracotta">7</div>
                <div className="text-sm text-muted">週連續完成記錄</div>
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-white p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">歷史完成場次</span>
                  <strong className="text-forest">23 場</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">完成雜事件數</span>
                  <strong className="text-forest">31 件</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">本場進度</span>
                  <strong>{completedCount} / {tasks.length}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {ended ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-[440px] rounded-2xl border-[1.5px] border-border bg-white p-6 text-ink shadow-lift">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-forest-lt text-xl font-black text-forest">✓</div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-terracotta">場次結束</div>
            <h2 className="mb-2 font-serif text-3xl font-black leading-tight tracking-normal">
              完成 {completedCount} 件，{remainingCount} 件留到下次
            </h2>
            <p className="mb-5 text-sm leading-[1.7] text-muted">
              做完的會標記完成；還沒做完的會留在我的待辦清單，之後可以再安排。
            </p>
            <div className="mb-5 grid gap-2">
              {tasks.map((task) => (
                <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${task.done ? "bg-forest-lt text-forest" : "bg-cream text-muted"}`} key={task.id}>
                  {task.done ? "已完成：" : "下次再做："}{task.title}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Link className="flex-1 rounded-full bg-terracotta px-4 py-3 text-center text-sm font-bold text-white no-underline hover:bg-terracotta-d" href="/tasks">
                回我的待辦清單
              </Link>
              <Link
                className="flex-1 rounded-full border border-border px-4 py-3 text-center text-sm font-bold text-muted no-underline hover:border-muted hover:text-ink"
                href="/my-sessions"
              >
                回已預約場次
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
