"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "./ButtonLink";
import { SessionAvailability } from "./SessionAvailability";

// Supply published sessions and verified account data from the server when available.
export type HomeSession = {
  title: string;
  startsAt: string;
  endsAt: string;
  bookingHref: string;
  bookedCount?: number;
  capacity?: number;
};

export type HomeSessionCardProps = {
  preview?: boolean;
  loadError?: boolean;
  upcomingSessions?: HomeSession[];
  member?: {
    consecutiveWeeks?: number;
    reservation?: HomeSession & {
      tasks: string[];
      detailsHref: string;
      waitingHref: string;
      roomHref: string;
    };
  };
};

const dateFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei", month: "numeric", day: "numeric", weekday: "short"
});
const timeFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false
});

export function HomeSessionCard({ upcomingSessions = [], member, preview = false, loadError = false }: HomeSessionCardProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const reservation = member?.reservation;
  const session = preview ? reservation ?? upcomingSessions[0] : now === null ? undefined : member
    ? reservation && Date.parse(reservation.endsAt) > now ? reservation : undefined
    : upcomingSessions.filter((item) => Date.parse(item.startsAt) > now)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  const start = session ? Date.parse(session.startsAt) : 0;
  const end = session ? Date.parse(session.endsAt) : 0;
  const live = !preview && !!session && now !== null && now >= start;
  const waiting = !preview && !!session && now !== null && now >= start - 5 * 60 * 1000;
  const remaining = now === null ? 0 : Math.max(0, Math.ceil((end - now) / 1000));
  const href = member && reservation
    ? live ? reservation.roomHref : waiting ? reservation.waitingHref : reservation.detailsHref
    : session ? session.bookingHref : undefined;

  return (
    <div className="rounded-xl2 border-[1.5px] border-border bg-white p-6 shadow-lift">
      {preview ? <p className="mb-3 text-xs text-light">場次示意 · 日期與內容為示範資料</p> : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-forest-lt px-3 py-1 text-xs font-semibold text-forest">
          {member ? "我的下一場" : "即將開始的場次"}
        </span>
        <span className="text-sm text-muted">每房最多 {session?.capacity ?? 5} 人{session ? ` · ${Math.round((end - start) / 60000)} 分鐘` : ""}</span>
      </div>
      {session ? (
        <>
          <h2 className="font-serif text-2xl font-black">{session.title}</h2>
          <p className="mt-3 text-sm text-muted">
            {dateFormat.format(start)} · {timeFormat.format(start)} – {timeFormat.format(end)}（台灣時間）
          </p>
          {member && reservation ? (
            <div className="mt-5 space-y-2">
              <h3 className="text-sm font-bold">這場的待辦事項</h3>
              {reservation.tasks.length ? reservation.tasks.map((task, index) => (
                <div className="rounded-xl bg-cream p-3 text-sm" key={index}>{task}</div>
              )) : <p className="text-sm text-muted">還沒安排待辦，可以在開場前補上。</p>}
              <p className="pt-2 text-sm text-muted">
                {live ? `進行中 · 剩餘 ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                  : waiting ? "等候區已開放" : "活動開始前五分鐘開放等候區"}
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-cream p-4 text-sm leading-relaxed text-muted">
              帶一件想完成的雜事，和同房夥伴一起專注。預約時可以先安排這場的待辦事項。
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            {session.bookedCount !== undefined ? <SessionAvailability bookedCount={session.bookedCount} capacity={session.capacity} /> : null}
            {!member && session.bookedCount !== undefined && session.bookedCount >= (session.capacity ?? 5) ? (
              <button disabled className="min-h-11 cursor-not-allowed rounded-full bg-cream-d px-6 py-3 text-sm font-bold leading-5 text-light">已額滿</button>
            ) : <ButtonLink href={href!} className="min-h-11 justify-center px-6 py-3 font-bold leading-5">
              {member ? live ? "進入場次" : waiting ? "進入等候區" : "查看預約" : "加入這場次"}
            </ButtonLink>}
          </div>
        </>
      ) : (
        <>
          <h2 className="font-serif text-2xl font-black">{loadError ? "場次暫時無法載入" : now === null ? "正在確認場次" : member ? "下一場，留一段時間給自己" : "場次安排中"}</h2>
          <p className="my-5 text-sm leading-relaxed text-muted">
            {loadError ? "請稍後重新整理，或前往場次列表重試。" : member ? "你還沒有即將開始的預約。挑一個適合的時段，帶著待辦一起來。" : "新的場次開放後，這裡會顯示最近一場的時間，讓你直接加入。"}
          </p>
          <ButtonLink href="/sessions" variant="outline" className="min-h-11 justify-center px-6 py-3 font-bold leading-5">{member ? "預約下一場" : "查看場次安排"}</ButtonLink>
        </>
      )}
      {member?.consecutiveWeeks !== undefined && member.consecutiveWeeks > 0 ? (
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">已連續 {member.consecutiveWeeks} 週完成雜事</p>
      ) : null}
    </div>
  );
}
