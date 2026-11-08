import { SessionAvailability } from "./SessionAvailability";
import { ButtonLink } from "./ButtonLink";
import type { HomeSession } from "./HomeSessionCard";
import { sessionDate, sessionTime } from "@/lib/bookingErrors";

export function Sessions({ sessions, loadError = false }: { sessions: HomeSession[]; loadError?: boolean }) {
  return (
    <section id="sessions" className="bg-[#F7F9F7] px-[6%] py-24 max-[720px]:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between gap-8 max-[720px]:items-start">
          <div>
            <p className="mb-4 text-sm font-bold text-[#244D3D]">近期場次</p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] font-black leading-[1.06]">
              找一段時間，<br />留給那件事。
            </h2>
          </div>
          <ButtonLink href="/sessions" variant="outline" className="border-black/25 bg-[#FFFDF8] px-5 py-2.5 max-[600px]:hidden">
            查看所有場次
          </ButtonLink>
        </div>

        <div className="rv border-t-2 border-ink">
          {loadError ? (
            <p role="alert" className="border-b border-ink/25 py-7 text-ink/60">場次暫時無法載入，請稍後重新整理。</p>
          ) : !sessions.length ? (
            <p className="border-b border-ink/25 py-7 text-ink/60">目前沒有開放場次，請稍後再來看看。</p>
          ) : sessions.map(session => {
            const full = (session.bookedCount ?? 0) >= (session.capacity ?? 5);
            return (
              <article
                className="grid grid-cols-[140px_150px_1fr_130px_auto] items-center gap-6 border-b border-ink/25 py-6 max-[900px]:grid-cols-[130px_1fr_auto] max-[620px]:grid-cols-[1fr_auto] max-[620px]:gap-2"
                key={session.bookingHref}
              >
                <div className="text-sm font-bold max-[620px]:col-span-2">{sessionDate(session.startsAt)}</div>
                <div className="text-sm text-ink/65 max-[900px]:col-start-1 max-[620px]:col-span-2">
                  {sessionTime(session.startsAt)}–{sessionTime(session.endsAt)}
                </div>
                <h3 className="font-serif text-xl font-bold max-[900px]:col-start-2 max-[900px]:row-start-1 max-[620px]:col-start-1 max-[620px]:row-auto">
                  {session.title}
                </h3>
                <div className="max-[900px]:hidden">
                  <SessionAvailability bookedCount={session.bookedCount ?? 0} capacity={session.capacity} />
                </div>
                {full ? (
                  <button disabled className="rounded-md border border-black/15 px-5 py-2.5 text-sm font-bold text-ink/35">已額滿</button>
                ) : (
                  <ButtonLink href={session.bookingHref} variant="outline" className="border-black/25 bg-[#FFFDF8]/70 px-5 py-2.5 font-bold hover:bg-[#FFFDF8]">
                    預約
                  </ButtonLink>
                )}
              </article>
            );
          })}
        </div>
        <ButtonLink href="/sessions" variant="outline" className="mt-8 hidden border-black/25 bg-[#FFFDF8] px-5 py-2.5 max-[600px]:inline-flex">
          查看所有場次
        </ButtonLink>
      </div>
    </section>
  );
}
