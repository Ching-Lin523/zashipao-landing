'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { Logo } from './Logo';
export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [ready, setReady] = useState(!reset);
  const [allowed, setAllowed] = useState(!reset);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!reset) {
      if (new URLSearchParams(window.location.search).has('error')) { setFailed(true); setMessage('重設連結已失效，或不是在原本的瀏覽器開啟。請重新索取連結。'); }
      return;
    }
    let active = true;
    void browserAuth().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setAllowed(!error && !!data.user); setReady(true);
    }).catch(() => { if (active) { setAllowed(false); setReady(true); } });
    return () => { active = false; };
  }, [reset]);
  return <main className="min-h-screen bg-cream px-[5%] py-10"><div className="mx-auto max-w-md"><Logo />
    <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-soft">
      <h1 className="font-serif text-3xl font-black">{reset ? '設定新密碼' : '忘記密碼'}</h1>
      <p className="my-4 text-sm text-muted">{reset ? '輸入至少 8 個字元的新密碼。' : '輸入註冊時的 Email，我們會寄送密碼重設連結。請在這個瀏覽器開啟驗證信。'}</p>
      {!ready ? <p role="status">正在確認登入狀態…</p> : !allowed ? <p role="alert">驗證狀態已失效，請<Link href="/forgot-password" className="text-terracotta underline">重新索取重設連結</Link>。</p> : !done ? <form className="grid gap-4" onSubmit={async event => {
        event.preventDefault(); if (lock.current) return;
        const form = event.currentTarget, values = new FormData(form);
        setFailed(false); setMessage('');
        const password = String(values.get('password') ?? '');
        if (reset && password !== values.get('confirm')) { setFailed(true); setMessage('兩次輸入的密碼不一致。'); return; }
        lock.current = true; setBusy(true);
        try {
          const client = browserAuth();
          const { error } = reset ? await client.auth.updateUser({ password }) : await client.auth.resetPasswordForEmail(String(values.get('email') ?? '').trim(), {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
          });
          if (error) {
            const messages: Record<string, string> = { same_password: '新密碼必須與舊密碼不同。', weak_password: '密碼強度不足，請使用更長且混合英文字母、數字的密碼。', over_email_send_rate_limit: '寄信次數已達上限，請稍後再試。', over_request_rate_limit: '操作太頻繁，請稍後再試。', reauthentication_needed: '請重新索取驗證信後再修改密碼。' };
            setFailed(true); setMessage(messages[error.code ?? ''] ?? '目前無法完成操作，請稍後重試。'); return;
          }
          form.reset(); setDone(true);
          setMessage(reset ? '新密碼已儲存。你可以登出後，使用新密碼登入測試。' : '若此 Email 已註冊，我們會寄送重設連結。請查看收件匣與垃圾郵件。');
        } catch { setFailed(true); setMessage('連線失敗，請檢查網路後重試。'); }
        finally { lock.current = false; setBusy(false); }
      }}>
        <fieldset disabled={busy} className="grid gap-4">
          {reset ? <>
            <label className="grid gap-1 text-sm">新密碼<input name="password" type="password" autoComplete="new-password" required minLength={8} className="rounded-lg border border-border px-3 py-3" /></label>
            <label className="grid gap-1 text-sm">確認新密碼<input name="confirm" type="password" autoComplete="new-password" required minLength={8} className="rounded-lg border border-border px-3 py-3" /></label>
          </> : <label className="grid gap-1 text-sm">Email<input name="email" type="email" autoComplete="email" required className="rounded-lg border border-border px-3 py-3" /></label>}
          <button type="submit" className="rounded-full bg-terracotta px-4 py-3 font-bold text-white">{busy ? '處理中…' : reset ? '儲存新密碼' : '寄送重設連結'}</button>
        </fieldset>
      </form> : null}
      {message ? <p role={failed ? 'alert' : 'status'} className={`mt-4 text-sm ${failed ? 'text-terracotta' : 'text-forest'}`}>{message}</p> : null}
      <Link href={reset && done ? '/sessions' : '/login'} className="mt-6 inline-block text-sm text-muted underline">{reset && done ? '回到可預約場次' : '返回登入'}</Link>
    </section>
  </div></main>;
}
