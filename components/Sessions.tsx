import { SessionAvailability } from "./SessionAvailability";
import { ButtonLink } from "./ButtonLink";
import { SectionHeading } from "./SectionHeading";

import type { HomeSession } from "./HomeSessionCard";
import { sessionDate, sessionTime } from "@/lib/bookingErrors";

const delays = [
  {
    label: "申報所得稅（已申請延期）",
    width: "90%",
    color: "#E24B4A",
    days: "62 天",
    badge: "⚠ 很急",
    badgeClass: "bg-[#FCEBEB] text-[#E24B4A]"
  },
  {
    label: "更新護照（已快到期）",
    width: "66%",
    color: "#BA7517",
    days: "45 天",
    badge: "催一催",
    badgeClass: "bg-amberish-lt text-amberish"
  },
  {
    label: "預約健康檢查",
    width: "55%",
    color: "#BA7517",
    days: "38 天",
    badge: "催一催",
    badgeClass: "bg-amberish-lt text-amberish"
  },
  {
    label: "整理健保存摺",
    width: "32%",
    color: "#4A7260",
    days: "22 天",
    badge: "還好",
    badgeClass: "bg-forest-lt text-forest"
  },
  {
    label: "回覆表哥婚禮邀請",
    width: "16%",
    color: "#7062A3",
    days: "11 天",
    badge: "新加入",
    badgeClass: "bg-lavender-lt text-lavender"
  }
];

export function Sessions({ sessions, loadError = false }: { sessions: HomeSession[]; loadError?: boolean }) {
  return (
    <section id="sessions" className="px-[6%] py-22">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex items-end justify-between gap-4 max-[720px]:items-start">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[.1em] text-terracotta">即將開始的場次</div>
            <h2 className="m-0 font-serif text-3xl font-black leading-tight">挑一段時間，一起開始</h2>
          </div>
          <ButtonLink href="/sessions" variant="outline" className="px-5 py-2">
            查看所有場次
          </ButtonLink>
        </div>

        <div className="rv flex flex-col gap-3">
          {loadError ? <p role="alert" className="rounded-xl bg-white p-5 text-muted">場次暫時無法載入，請稍後重新整理或查看所有場次。</p> : !sessions.length ? <p className="rounded-xl bg-white p-5 text-muted">目前沒有開放場次，請稍後再來看看。</p> : sessions.map(session => (
            <article key={session.bookingHref} className="flex flex-wrap items-center gap-6 rounded-xl border-[1.5px] border-border bg-white p-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{sessionDate(session.startsAt)}（台灣時間）</p>
                <h3 className="mt-2 text-lg font-bold">{session.title}</h3>
                <p className="mt-2 text-sm text-muted">{sessionTime(session.startsAt)}–{sessionTime(session.endsAt)}</p>
              </div>
              <SessionAvailability bookedCount={session.bookedCount ?? 0} capacity={session.capacity} />
              {(session.bookedCount ?? 0) >= (session.capacity ?? 5) ? <button disabled className="rounded-full border border-border px-5 py-2 text-sm text-light">已額滿</button> : <ButtonLink href={session.bookingHref} variant="outline" className="px-5 py-2 text-sm">預約</ButtonLink>}
            </article>
          ))}
        </div>

        <div className="rv mt-10 rounded-xl2 border-[1.5px] border-border bg-white px-9 py-8">
          <div className="mb-6">
            <div className="mb-1 font-serif text-xl font-bold">你的雜事，到底拖了多久？（功能示意）</div>
            <div className="text-sm text-muted">雜事房替你記錄每一件事的「誕生日」，讓拖延指數一目瞭然</div>
          </div>
          <div className="flex flex-col gap-3.5">
            {delays.map((delay) => (
              <div className="flex items-center gap-5 max-[720px]:grid max-[720px]:grid-cols-[1fr_auto] max-[720px]:gap-2" key={delay.label}>
                <div className="min-w-[190px] truncate text-sm font-medium max-[720px]:col-span-2">{delay.label}</div>
                <div className="h-2 flex-1 overflow-hidden rounded bg-cream-d max-[720px]:col-span-2">
                  <div
                    className="delay-bar h-full origin-left scale-x-0 rounded transition-transform duration-700"
                    style={{ width: delay.width, background: delay.color }}
                  />
                </div>
                <div className="min-w-12 text-right text-sm font-bold" style={{ color: delay.color }}>
                  {delay.days}
                </div>
                <div className={`min-w-14 rounded px-2 py-0.5 text-center text-xs font-semibold ${delay.badgeClass}`}>{delay.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
