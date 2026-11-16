'use client';
import { useEffect, useRef, useState } from 'react';
import { RoomChatDock, useChatDock } from './RoomWorkspace';
import { useChat, useConnectionState } from '@livekit/components-react';

type Message = { id: string; name: string; text: string; own?: boolean };

export function RoomChatPanel({ messages, send, connected = true, preview = false }: {
  messages: Message[]; send: (text: string) => Promise<unknown>; connected?: boolean; preview?: boolean;
}) {
  const dock = useChatDock();
  const [expanded, setOpen] = useState(true);
  const open = dock ? dock.active : expanded;
  useEffect(() => { dock?.setCount(messages.length); }, [dock?.setCount, messages.length]);
  const [seen, setSeen] = useState(messages.length);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  useEffect(() => {
    if (open) {
      setSeen(messages.length);
      if (follow.current && list.current) list.current.scrollTop = list.current.scrollHeight;
    }
  }, [messages.length, open]);
  const unread = Math.max(0, messages.length - seen);
  return <RoomChatDock><section className="room-chat mt-5 overflow-hidden rounded-lg border border-white/20 bg-ink text-white" aria-label="本場聊天">
    {!dock && <button type="button" aria-expanded={open} aria-controls="room-chat-content" className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => { follow.current = true; setOpen(!open); }}>
      <span className="font-bold">本場聊天 {preview && <span className="text-xs font-normal text-white/70">· 預覽</span>}</span>
      <span className="text-sm" aria-live="polite">{!open && unread > 0 ? `${unread} 則新訊息 · ` : ''}{open ? '收合 −' : '展開 ＋'}</span>
    </button>}
    <div id="room-chat-content" hidden={!open} className="room-chat-content border-t border-white/15 p-4">
      <p className="mb-3 text-xs leading-5 text-white/70">{preview ? '示意訊息；你輸入的內容只在此預覽顯示。' : '可保持靜音聊天。僅連線中的夥伴能收到；訊息不保存，重新整理或重新連線後不會補回。'}</p>
      <div ref={list} role="log" aria-label="聊天訊息" aria-live="polite" aria-relevant="additions" className="room-chat-messages max-h-60 space-y-3 overflow-y-auto overscroll-contain" onScroll={() => { const el = list.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50; }}>
        {messages.length === 0 && <p className="py-4 text-sm text-white/70">想提醒大家什麼？在這裡留一句話。</p>}
        {messages.map(message => <div key={message.id} className="rounded-lg bg-white/5 px-3 py-2">
          <p className="break-words text-xs font-bold text-coral">{message.name}{message.own ? '（你）' : ''}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white">{message.text}</p>
        </div>)}
      </div>
      <form className="mt-4" onSubmit={async event => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || !connected || lock.current) return;
        lock.current = true; setSending(true); setError('');
        try { await send(text); setDraft(''); follow.current = true; }
        catch { setError('訊息未送出，請確認連線後再試一次。'); }
        finally { lock.current = false; setSending(false); }
      }}>
        <label htmlFor="room-chat-draft" className="sr-only">輸入聊天訊息</label>
        <textarea id="room-chat-draft" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} rows={2} disabled={sending} placeholder="輸入訊息，不打斷大家的專注…" className="w-full resize-y rounded-lg border border-white/30 bg-ink p-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-coral" />
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-white/70">{connected ? `${draft.length}/500 · 按送出傳送` : '重新連線中，暫時無法送出'}</span><button type="submit" disabled={!connected || sending || !draft.trim()} className="min-h-11 rounded-lg bg-coral px-5 text-sm font-bold text-ink disabled:opacity-50">{sending ? '傳送中…' : '送出'}</button></div>
        {error && <p role="alert" className="mt-2 text-sm text-paper">{error}</p>}
      </form>
    </div>
  </section></RoomChatDock>;
}

export function RoomChat() {
  const { chatMessages, send } = useChat();
  const connection = useConnectionState();
  return <RoomChatPanel connected={connection === 'connected'} send={send} messages={chatMessages.map(message => ({ id: message.id, name: message.from?.name || '夥伴', text: message.message, own: message.from?.isLocal }))} />;
}

export function DemoRoomChat() {
  const [messages, setMessages] = useState<Message[]>([{ id: 'example', name: '芯（示意）', text: '我先靜音專注，有事可以在這裡留言。' }]);
  return <RoomChatPanel preview messages={messages} send={async text => { setMessages(current => [...current, { id: crypto.randomUUID(), name: '你', text }]); }} />;
}
