import { PersonalHomeSession } from "./PersonalHomeSession";
import { ButtonLink } from "./ButtonLink";
import { HomeSessionCardProps } from "./HomeSessionCard";

export function Hero(props: HomeSessionCardProps) {
  return (
    <section className="px-0 py-0">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-14 px-[6%] py-14 pt-20 max-[900px]:grid-cols-1 max-[900px]:px-[5%] max-[900px]:py-12">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-terracotta-lt px-3.5 py-1.5 text-xs font-semibold text-terracotta">
            <span className="size-[7px] animate-blink rounded-full bg-terracotta" />
            每房最多 5 人，一起專注 50 分鐘
          </div>
          <h1 className="mb-5 font-serif text-5xl font-black leading-[1.22] tracking-normal max-[900px]:text-4xl">
            把一直
            <br />
            拖著的事，
            <br />
            <em className="not-italic text-terracotta">今天一起做完</em>
          </h1>
          <p className="mb-8 max-w-[440px] text-[1.05rem] leading-[1.75] text-muted">
            加入線上共事場次，在 50 分鐘內完成那些你清單上
            <br />
            永遠排不到的生活雜事。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/login" className="px-7 py-3 text-base font-bold">
              免費加入，今天就開始
            </ButtonLink>
            <ButtonLink href="#sessions" variant="outline" className="px-6 py-[.7rem] text-[.95rem]">
              看可預約場次 →
            </ButtonLink>
          </div>

        </div>

        <PersonalHomeSession {...props} />
      </div>
    </section>
  );
}
