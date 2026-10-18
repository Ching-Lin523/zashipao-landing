'use client';
import { useEffect, useRef, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';

export function NicknameEditor() {
  const [value, setValue] = useState('');
  const [current, setCurrent] = useState('');
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange((_event, session) => {
      const name = session?.user.user_metadata?.nickname;
      const nickname = typeof name === 'string' ? name.trim() : '';
      setCurrent(nickname); setValue(nickname); setReady(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (!ready) return null;
  return <section className="my-5 rounded-xl border border-border p-4" aria-label="房間暱稱">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{current ? `房間暱稱：${current}` : '讓同場夥伴知道怎麼稱呼你'}</h2>
      {!editing && (current || skipped) ? <button onClick={() => { setEditing(true); setMessage(''); }} className="min-h-11 text-sm text-terracotta underline">{current ? '修改暱稱' : '設定暱稱'}</button> : null}
    </div>
    {editing || (!current && !skipped) ? <form className="mt-3" onSubmit={async event => {
      event.preventDefault(); if (lock.current) return;
      const nickname = value.trim();
      if (Array.from(nickname).length > 24 || /[\u0000-\u001f\u007f]/.test(nickname)) { setMessage('暱稱限 24 個字，不能包含換行或控制字元。'); return; }
      lock.current = true; setBusy(true); setMessage('');
      try {
        const { error } = await browserAuth().auth.updateUser({ data: { nickname } });
        if (error) throw error;
        setEditing(false); setSkipped(!nickname); setMessage('已儲存，進房連接視訊時會帶入這個暱稱。');
      } catch { setMessage('暱稱未能儲存，請重試。'); }
      finally { lock.current = false; setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">暱稱（選填）<input value={value} disabled={busy} onChange={event => setValue(event.target.value)} placeholder="例如：小晴" className="rounded-lg border border-border px-3 py-3" /></label>
      <p className="my-3 text-xs text-muted">同場夥伴會看到這個名字，之後的場次也會沿用。留空則使用夥伴編號。</p>
      <div className="flex gap-3"><button disabled={busy} className="min-h-11 rounded-full bg-forest px-5 py-2 text-sm text-white">{busy ? '儲存中…' : '儲存暱稱'}</button><button type="button" disabled={busy} onClick={() => { setSkipped(true); setEditing(false); setValue(current); }} className="min-h-11 px-3 text-sm text-muted">{current ? '取消' : '先略過'}</button></div>
    </form> : null}
    {message ? <p role="status" className="mt-3 text-sm text-muted">{message}</p> : null}
  </section>;
}
