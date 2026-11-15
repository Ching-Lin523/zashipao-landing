'use client';
import { useRef, useState } from 'react';

export function LeaveRoomButton({ onLeave, preview = false, disabled = false }: { onLeave: () => Promise<void> | void; preview?: boolean; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <>
    <button type="button" disabled={disabled} className="mt-3 min-h-11 self-end rounded-full bg-terracotta px-6 py-2 text-sm font-bold text-white hover:opacity-90" onClick={() => { setError(''); dialog.current?.showModal(); }}>離開</button>
    <dialog ref={dialog} aria-labelledby="leave-room-title" onCancel={event => { if (busy) event.preventDefault(); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-cream p-6 text-ink shadow-xl backdrop:bg-black/50">
      <h2 id="leave-room-title" className="font-serif text-2xl font-bold">確認離開房間？</h2>
      <p className="mt-4 text-sm leading-7 text-muted">進度會保留，場次結束前都能再加入。</p>
      <p className="mt-2 text-xs leading-6 text-muted">離開期間的聊天訊息不會補回。</p>
      {preview && <p className="mt-2 text-xs text-muted">這是介面預覽，不會影響真實場次。</p>}
      {error && <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button autoFocus type="button" disabled={busy} className="min-h-11 rounded-full border border-border px-5 text-sm" onClick={() => dialog.current?.close()}>繼續專注</button>
        <button type="button" disabled={busy} className="min-h-11 rounded-full bg-terracotta px-5 text-sm font-bold text-white disabled:opacity-50" onClick={async () => {
          if (busy) return;
          setBusy(true);
          try { await onLeave(); dialog.current?.close(); }
          catch { setError('暫時無法離開，請再試一次。'); }
          finally { setBusy(false); }
        }}>{busy ? '離開中…' : '確認離開'}</button>
      </div>
    </dialog>
  </>;
}
