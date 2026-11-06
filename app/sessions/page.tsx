import { AccountMenu } from "@/components/AccountMenu";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getPublicSessions, type PublicSession } from "@/lib/publicSessions";

export const metadata = { title: "可預約場次 — 雜事房" };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
});
const timeFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});

export default async function SessionsPage({ searchParams }: { searchParams: { tasks?: string } }) {
  const tasks = (searchParams.tasks ?? "").split(",").filter(id => /^\d+$/.test(id)).join(",");
  let sessions: PublicSession[] = [];
  let failed = false;
  try { sessions = await getPublicSessions(); }
  catch { failed = true; }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-cream">
        <div className="mx-auto flex min-h-[62px] max-w-7xl flex-wrap items-center justify-between gap-3 px-[5%] py-3">
          <Logo />
          <nav className="flex flex-wrap gap-3 text-sm">
            <Link href="/my-sessions" className="rounded-full border border-border px-4 py-2 text-muted">已預約場次</Link>
            <Link href="/sessions" aria-current="page" className="rounded-full bg-terracotta-lt px-4 py-2 font-bold text-terracotta">可預約場次</Link>
            <Link href="/tasks" className="rounded-full border border-border px-4 py-2 text-muted">我的待辦清單</Link>
            <AccountMenu />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-[5%] py-8">
        <h1 className="font-serif text-4xl font-black">可預約場次</h1>
        <p className="mt-3 text-muted">找一段時間，和夥伴一起處理掛心的雜事。以下皆為台灣時間。</p>
        <p className="mt-4 rounded-xl bg-forest-lt p-3 text-sm text-forest">選好場次後，勾選這次想完成的待辦，再確認預約。</p>
        <div className="mt-6 grid gap-4">
          {failed ? (
            <div role="alert" className="rounded-2xl border border-border bg-white p-6">
              <p>場次暫時無法載入，請稍後再試。</p>
              <a href="/sessions" className="mt-3 inline-block font-bold text-terracotta underline">重新載入</a>
            </div>
          ) : sessions.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white p-6 text-muted">目前沒有即將開始的公開場次，請稍後再來看看。</p>
          ) : sessions.map(session => (
            <article key={session.id} className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border-[1.5px] border-border bg-white p-6 shadow-soft">
              <div>
                <p className="text-sm text-muted">{dateFormat.format(new Date(session.starts_at))}</p>
                <h2 className="mt-2 font-serif text-2xl font-bold">{session.title}</h2>
                <p className="mt-2 text-muted">{timeFormat.format(new Date(session.starts_at))} – {timeFormat.format(new Date(session.ends_at))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted">{session.booked_count} / {session.capacity} 人 · 還有 {Math.max(0, session.capacity - session.booked_count)} 個名額</span>
                {session.booked_count >= session.capacity ? <button disabled className="rounded-full border border-border px-5 py-2 text-muted">已額滿</button> : <Link className="rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white" href={`/sessions/book?session=${session.id}${tasks ? `&tasks=${encodeURIComponent(tasks)}` : ""}`}>預約這場次</Link>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
