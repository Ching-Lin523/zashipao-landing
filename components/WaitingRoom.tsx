"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "./Logo";

type WaitingTask = {
  id: number;
  title: string;
  category: string;
  selected: boolean;
};

const initialTasks: WaitingTask[] = [
  { id: 1, title: "補齊所得稅延期申報資料", category: "財務", selected: true },
  { id: 2, title: "預約牙醫洗牙", category: "健康醫療", selected: true },
  { id: 3, title: "更新護照照片預約", category: "文件行政", selected: false },
  { id: 4, title: "退 iHerb 重複訂單", category: "購物退款", selected: false }
];

export function WaitingRoom() {
  const [tasks, setTasks] = useState(initialTasks);
  const [adHocTitle, setAdHocTitle] = useState("");
  const selectedTasks = tasks.filter((task) => task.selected);

  function toggleTask(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, selected: !task.selected } : task))
    );
  }

  function addAdHocTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = adHocTitle.trim();
    if (!trimmedTitle) return;

    setTasks((current) => [
      { id: Date.now(), title: trimmedTitle, category: "臨時事項", selected: true },
      ...current
    ]);
    setAdHocTitle("");
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
            <Link className="rounded-full bg-terracotta-lt px-4 py-2 font-bold text-terracotta no-underline" href="/sessions/waiting/demo">
              等候區
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-[5%] py-8">
        <section className="mb-6 grid grid-cols-[minmax(0,1fr)_220px] gap-5 max-[820px]:grid-cols-1">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-terracotta">等候區</div>
            <h1 className="font-serif text-4xl font-black leading-tight tracking-normal">開場前，再確認一次</h1>
            <p className="mt-2 max-w-[650px] text-[.96rem] leading-[1.7] text-muted">
              如果要做的事有變，現在可以調整一下。等進房後，就照這份清單開始。
            </p>
          </div>
          <div className="rounded-2xl border-[1.5px] border-border bg-white p-4 text-center shadow-soft">
            <div className="font-mono text-3xl font-black tracking-normal text-ink">04:32</div>
            <div className="mt-1 text-sm text-light">距離正式開始</div>
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-[960px]:grid-cols-1">
          <section>
            <form className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border-[1.5px] border-border bg-white p-3" onSubmit={addAdHocTask}>
              <input
                className="min-h-11 rounded-xl border-[1.5px] border-border bg-cream px-4 text-sm outline-none placeholder:text-light focus:border-terracotta"
                value={adHocTitle}
                onChange={(event) => setAdHocTitle(event.target.value)}
                placeholder="臨時要加進本場的事"
              />
              <button className="rounded-full bg-terracotta px-5 text-sm font-bold text-white hover:bg-terracotta-d" type="submit">
                加入本場
              </button>
            </form>

            <div className="grid gap-2">
              {tasks.map((task) => (
                <button
                  className={`grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-xl border p-3 text-left transition-colors ${
                    task.selected ? "border-terracotta bg-terracotta-lt/40" : "border-border bg-white hover:border-border-d"
                  }`}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  key={task.id}
                >
                  <span
                    className={`mt-0.5 flex size-5 items-center justify-center rounded-md border text-xs font-black ${
                      task.selected ? "border-terracotta bg-terracotta text-white" : "border-border bg-cream text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{task.title}</span>
                    <span className="mt-1 block text-xs text-light">{task.category}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-lift">
            <div className="mb-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-[.1em] text-terracotta">本場承諾</div>
              <h2 className="font-serif text-2xl font-black">{selectedTasks.length} 件雜事</h2>
            </div>
            <div className="mb-5 grid gap-2">
              {selectedTasks.map((task) => (
                <div className="rounded-xl bg-cream px-3 py-2 text-sm font-semibold text-muted" key={task.id}>
                  {task.title}
                </div>
              ))}
            </div>
            <Link
              className="block rounded-full bg-terracotta px-5 py-3 text-center text-sm font-bold text-white no-underline hover:bg-terracotta-d"
              href="/sessions/room/demo"
            >
              時間到，進入房間
            </Link>
            <p className="mt-3 text-center text-xs text-light">正式版會在時間到時自動開放。</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
