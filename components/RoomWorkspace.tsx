'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
const ChatDock = createContext<{ target: HTMLDivElement | null; active: boolean; setCount: (n: number) => void } | null>(null);
export function useChatDock() { return useContext(ChatDock); }
export function RoomChatDock({ children }: { children: ReactNode }) {
  const dock = useChatDock();
  return dock ? (dock.target ? createPortal(children, dock.target) : null) : children;
}


export function RoomWorkspace({ title, schedule, timer, video, children }: {
  title: string; schedule: string; timer: string; video: ReactNode; children: ReactNode;
}) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<'tasks' | 'chat'>('tasks');
  const [count, setCount] = useState(0);
  const [seen, setSeen] = useState(0);
  const unread = tab === 'chat' ? 0 : Math.max(0, count - seen);
  return <ChatDock.Provider value={{ target, active: tab === 'chat', setCount }}><section className="room-workspace overflow-hidden rounded-lg border border-white/15 bg-ink shadow-lift">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 px-5 py-5 text-white sm:px-6">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-bold tracking-normal text-coral">雜事房 · 一起專注</p>
        <h1 className="break-words font-sans text-xl font-bold sm:text-2xl">{title}</h1>
        <p className="mt-2 text-xs leading-6 text-white/70">{schedule}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="flex items-center gap-2 rounded-full bg-forest px-3 py-1 text-xs text-paper"><span className="size-2 rounded-full bg-current" />專注時間</span>
        <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-center">
          <p className="text-[10px] text-white/65">本場剩餘</p>
          <p role="timer" aria-label="本場剩餘時間" className="font-sans text-2xl font-bold tabular-nums">{timer}</p>
        </div>
      </div>
    </header>
    <div className="room-workspace-body grid min-h-0 flex-1 items-stretch lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="room-video-column min-h-0 min-w-0 p-4 text-white sm:p-6">{video}</div>
      <aside aria-label="房間工具" className="flex min-h-0 min-w-0 flex-col border-t border-white/10 bg-paper text-ink lg:border-l lg:border-t-0">
        <div className="flex shrink-0 border-b border-black/10 p-2" role="tablist" aria-label="房間工具">
          {(['tasks', 'chat'] as const).map(value => <button key={value} id={`room-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`room-panel-${value}`} className={`min-h-11 flex-1 rounded-full px-3 text-sm font-bold ${tab === value ? 'bg-forest text-white' : 'text-forest'}`} onClick={() => { setSeen(count); setTab(value); }}>{value === 'tasks' ? '本場待辦' : `本場聊天${unread ? ` · ${unread}` : ''}`}</button>)}
        </div>
        <div id="room-panel-tasks" role="tabpanel" aria-labelledby="room-tab-tasks" hidden={tab !== 'tasks'} className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mb-5 border-b border-border pb-4 text-forest"><p className="text-sm font-bold">開始前，分享你這場的小目標</p><p className="mt-1 text-xs leading-6">在「本場聊天」留一句：「這 50 分鐘，我想完成＿＿。」也可以開麥簡單說說，再靜音專注。不必分享私人細節。</p><p className="mt-1 text-xs leading-6">你的待辦不會自動公開給其他人。</p></div>{children}</div>
        <div id="room-panel-chat" role="tabpanel" aria-labelledby="room-tab-chat" hidden={tab !== 'chat'} className="room-chat-slot min-h-0 flex-1 bg-ink" ref={setTarget}>
          <p className="chat-empty p-5 text-sm text-white/75">連接視訊與聊天後，就能在這裡留言。鏡頭和麥克風可以保持關閉。</p>
        </div>
      </aside>
    </div>
  </section></ChatDock.Provider>;
}

export function RoomTaskProgress({ completed, total }: { completed: number; total: number }) {
  return <div className="mb-6">
    <h2 className="text-sm font-bold text-forest">本場承諾</h2>
    <p className="mt-2 text-2xl font-bold">{completed} / {total} <span className="text-base font-normal">已完成</span></p>
    <div role="progressbar" aria-label="本場待辦完成進度" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total || 1} className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
      <div className="h-full rounded-full bg-forest transition-[width] motion-reduce:transition-none" style={{ width: `${total ? completed / total * 100 : 0}%` }} />
    </div>
  </div>;
}
