'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
export function AccountMenu() {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingLock = useRef(false);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const client = browserAuth();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const metadata = session?.user.user_metadata;
      const displayName = [metadata?.nickname, metadata?.full_name, metadata?.name, metadata?.display_name]
        .find(value => typeof value === 'string' && value.trim());
      setNickname(typeof metadata?.nickname === 'string' ? metadata.nickname : '');
      setName(typeof displayName === 'string' ? displayName.trim() : '');
      setSignedIn(!!session?.user);
      setEmail(session?.user.email ?? null); setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (!ready) return <span className="text-sm text-muted">確認帳號中…</span>;
  return <div className="flex flex-wrap items-center gap-3 text-sm">
    {signedIn ? <details ref={menu} className="relative" onKeyDown={event => {
      if (event.key === 'Escape' && menu.current) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); }
    }}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold text-forest hover:bg-white focus-visible:outline-terracotta [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
        <span className="flex min-w-0 flex-col items-start leading-tight" title={email ?? name}>
          <span className="text-[10px] font-normal text-forest">已登入</span>
          <span className="max-w-[180px] truncate max-[480px]:max-w-[120px]">{name || email || '我的帳號'}</span>
        </span><span aria-hidden="true" className="text-xs">▾</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[85vw] rounded-2xl border border-border bg-white p-4 shadow-lift">
      <p className="mb-1 text-xs text-light">目前登入帳號</p><p className="mb-4 break-all text-sm text-ink">{email}</p>
      <form className="mb-4 border-b border-border pb-4" onSubmit={async event => {
        event.preventDefault();
        if (savingLock.current || busy) return;
        const value = nickname.trim();
        if (Array.from(value).length > 24 || /[\u0000-\u001f\u007f]/.test(value)) { setError('暱稱限 24 個字，不能包含換行或控制字元。'); return; }
        savingLock.current = true; setSaving(true); setSaved(false); setError('');
        try {
          const { error } = await browserAuth().auth.updateUser({ data: { nickname: value } });
          if (error) throw error;
          setSaved(true);
        } catch { setError('暱稱儲存失敗，請稍後重試。'); }
        finally { savingLock.current = false; setSaving(false); }
      }}>
        <label className="grid gap-2">房間暱稱<input value={nickname} disabled={saving || busy} onChange={event => { setNickname(event.target.value); setSaved(false); }} className="min-w-0 rounded-lg border border-border px-3 py-2 text-ink" placeholder="例如：小晴" /></label>
        <p className="my-2 text-xs leading-relaxed text-muted">同場夥伴會看到這個名字。留空則使用夥伴編號。</p>
        <button disabled={saving || busy} className="rounded-full bg-forest px-4 py-2 text-white disabled:opacity-50">{saving ? '儲存中…' : '儲存暱稱'}</button>
        {saved ? <p role="status" className="mt-2 text-xs text-forest">已儲存，下次連接視訊時會使用新暱稱。</p> : null}
      </form>
      <button disabled={busy || saving} className="rounded-full border border-border px-4 py-2" onClick={async () => {
        setBusy(true); setError('');
        try {
          const { error } = await browserAuth().auth.signOut({ scope: 'local' });
          if (error) throw error;
          window.location.assign('/login');
        } catch { setError('登出失敗，請重試。'); setBusy(false); }
      }}>{busy ? '登出中…' : '登出'}</button>
      {error ? <p role="alert" className="mt-2 text-terracotta">{error}</p> : null}
      </div>
    </details> : <><Link href="/login">登入</Link><Link className="rounded-full bg-terracotta px-4 py-2 text-white" href="/signup">免費加入</Link></>}
  </div>;
}
