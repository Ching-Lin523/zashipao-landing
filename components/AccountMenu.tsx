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
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const client = browserAuth();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null); setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (!ready) return <span className="text-sm text-muted">確認帳號中…</span>;
  return <div className="flex flex-wrap items-center gap-3 text-sm">
    {email ? <details ref={menu} className="relative" onKeyDown={event => {
      if (event.key === 'Escape' && menu.current) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); }
    }}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold text-muted hover:bg-white focus-visible:outline-terracotta [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
        帳號 <span aria-hidden="true" className="text-xs">▾</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[85vw] rounded-2xl border border-border bg-white p-4 shadow-lift">
      <p className="mb-1 text-xs text-light">目前登入帳號</p><p className="mb-4 break-all text-sm text-ink">{email}</p>
      <button disabled={busy} className="rounded-full border border-border px-4 py-2" onClick={async () => {
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
