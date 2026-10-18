"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { browserAuth } from "@/lib/supabase/browser";
import { authRedirect } from "@/lib/authRedirect";
import { Logo } from "./Logo";
import { PasswordField } from "./PasswordField";

type AuthMode = "login" | "signup";

type AuthCardProps = {
  mode: AuthMode;
};

const copy = {
  login: {
    eyebrow: "歡迎回來",
    title: "回到你的雜事房",
    subtitle: "登入後可以查看已預約場次、雜事清單和完成紀錄。",
    button: "登入",
    switchText: "還沒有帳號？",
    switchAction: "免費加入",
    switchHref: "/signup",
  },
  signup: {
    eyebrow: "免費開始",
    title: "加入第一批雜事房成員",
    subtitle: "用 Email 建立帳號，開始安排你的雜事時間。",
    button: "建立帳號",
    switchText: "已經有帳號？",
    switchAction: "登入",
    switchHref: "/login",
  }
};

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('next')) setNextPath(authRedirect(params.get('next')));
    if (params.has('error')) {
      setFailed(true); setMessage('驗證連結已失效，或不是在原本註冊的瀏覽器開啟。請重新登入；若尚未驗證，請使用最新的驗證信。');
    }
  }, []);
  const current = copy[mode];
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const nickname = String(form.get('nickname') ?? '').trim();
    const password = String(form.get('password') ?? '');
    setMessage(''); setFailed(false);
    if (isSignup && password !== form.get('confirmPassword')) {
      setFailed(true); setMessage('兩次輸入的密碼不一致。'); return;
    }
    if (isSignup && (Array.from(nickname).length > 24 || /[\u0000-\u001f\u007f]/.test(nickname))) {
      setFailed(true); setMessage('暱稱限 24 個字，不能包含換行或控制字元。'); return;
    }
    setBusy(true);
    try {
      const client = browserAuth();
      const result = isSignup
        ? await client.auth.signUp({ email, password, options: {
            data: { nickname },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath ?? '/sessions')}`
          } })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) {
        const code = result.error.code;
        const messages: Record<string, string> = {
          invalid_credentials: 'Email 或密碼不正確。',
          email_not_confirmed: '請先到信箱完成 Email 驗證，再登入。',
          user_already_exists: '此 Email 已註冊，請改用登入。',
          weak_password: '密碼強度不足，請使用至少 8 個字元並混合英文字母與數字。',
          over_email_send_rate_limit: '驗證信寄送次數已達上限，請稍後再試。',
          over_request_rate_limit: '操作太頻繁，請稍後再試。',
          email_address_not_authorized: '目前寄信服務尚未允許此 Email，請聯絡管理者完成寄信設定。'
        };
        setFailed(true); setMessage(messages[code ?? ''] ?? '目前無法完成操作，請稍後再試。');
      } else if (result.data.session) {
        router.replace(nextPath ?? '/sessions'); router.refresh();
      } else {
        setMessage('若此 Email 可註冊，我們已寄出驗證信。請在這個瀏覽器開啟信中的連結；若已有帳號，請直接登入。');
      }
    } catch { setFailed(true); setMessage('連線失敗，請檢查網路後重試。'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-x-10 px-[6%] py-8 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <section className="flex flex-col justify-between py-8 max-[900px]:py-0">
          <Logo />
          <div className="max-w-[440px] max-[900px]:mt-12">
            <div className="mb-4 inline-flex rounded-full border border-terracotta/20 bg-terracotta-lt px-3 py-1 text-xs font-bold text-terracotta">
              50 分鐘，把一件事做完
            </div>
            <h1 className="mb-5 font-serif text-5xl font-black leading-tight tracking-normal max-[720px]:text-4xl">
              {isSignup ? "把拖著的事，變成今天完成的事" : "繼續清掉那些一直掛心的小事"}
            </h1>
            <p className="text-[1.02rem] leading-[1.75] text-muted">
              雜事房把生活行政、預約、退款、整理文件這些容易被擠掉的任務，放進一個有人一起開始、一起收尾的共事節奏。
            </p>
          </div>
          <div className="grid max-w-[520px] grid-cols-3 gap-3 text-sm max-[900px]:hidden">
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="font-serif text-2xl font-black text-terracotta">50</div>
              <div className="text-muted">分鐘場次</div>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="font-serif text-2xl font-black text-forest">8,431</div>
              <div className="text-muted">件雜事完成</div>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="font-serif text-2xl font-black text-lavender">10+</div>
              <div className="text-muted">每日場次</div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[460px] rounded-xl2 border-[1.5px] border-border bg-white p-8 shadow-lift max-[520px]:p-6">
            <div className="mb-7">
              <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-terracotta">{current.eyebrow}</div>
              <h2 className="mb-2 font-serif text-3xl font-black tracking-normal">{current.title}</h2>
              <p className="text-sm leading-[1.7] text-muted">{current.subtitle}</p>
              {nextPath ? <p className="mt-4 rounded-xl bg-terracotta-lt px-4 py-3 text-sm font-semibold text-terracotta">{isSignup ? "建立帳號後，繼續預約這場次。" : "請先登入，再加入這場次。"}</p> : null}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup ? <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">暱稱（選填）</span><input name="nickname" autoComplete="nickname" placeholder="例如：小晴" className="w-full rounded-xl border-[1.5px] border-border bg-cream px-4 py-3 text-base" /><span className="mt-2 block text-xs text-muted">同場夥伴會看到這個名字。也可以之後在等候區設定。</span></label> : null}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
                <input
                  className="w-full rounded-xl border-[1.5px] border-border bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-light focus:border-terracotta"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <PasswordField
                label="密碼"
                name="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="至少 8 個字元"
                minLength={isSignup ? 8 : undefined}
              />
              {isSignup ? (
                <PasswordField
                  label="確認密碼"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="再輸入一次密碼"
                  minLength={8}
                />
              ) : null}

              {!isSignup ? <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-terracotta">忘記密碼？</Link></div> : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-terracotta px-5 py-3 text-base font-bold text-white transition-all hover:-translate-y-px hover:bg-terracotta-d"
              >
                {busy ? "處理中…" : current.button}
              </button>
            </form>

            {message ? <div role={failed ? 'alert' : 'status'} className={`mt-5 rounded-xl p-4 text-sm ${failed ? 'bg-terracotta-lt text-terracotta' : 'bg-forest-lt text-forest'}`}>{message}</div> : null}

            <div className="mt-7 border-t border-cream-d pt-5 text-center text-sm text-muted">
              {current.switchText}{" "}
              <Link className="font-bold text-terracotta no-underline hover:text-terracotta-d" href={nextPath ? `${current.switchHref}?next=${encodeURIComponent(nextPath)}` : current.switchHref}>
                {current.switchAction}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
