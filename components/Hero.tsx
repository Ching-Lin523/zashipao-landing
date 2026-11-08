import { ButtonLink } from "./ButtonLink";

export function Hero() {
  return (
    <section className="overflow-hidden bg-white px-[5%] pb-24 pt-20 max-[720px]:pb-16 max-[720px]:pt-14">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto flex max-w-[880px] flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-2 text-sm font-bold text-[#33614E]">
            <span className="block h-2 w-2 bg-[#FF5A36]" aria-hidden="true" />
            線上共做空間
          </div>
          <h1 className="font-sans text-[clamp(4.25rem,8vw,7.4rem)] font-black leading-none text-ink">雜事房</h1>
          <p className="mt-7 font-sans text-[clamp(2rem,4vw,3.65rem)] font-black leading-[1.24] text-ink">
            把生活裡一直拖著的事
            <span className="mx-2 inline-flex size-[.9em] translate-y-[.08em] items-center justify-center rounded-sm bg-[#F1D55D] align-baseline text-[.48em]" aria-hidden="true">✓</span>
            <br className="max-[540px]:hidden" />
            和一群人一起開始
            <span className="mx-2 inline-flex size-[.9em] translate-y-[.08em] items-center justify-center rounded-full bg-[#B9DDE4] align-baseline text-[.42em]" aria-hidden="true">◷</span>
          </p>
          <p className="mt-6 max-w-[590px] text-base leading-[1.75] text-ink/60">
            這是一個 5 人以內的線上共做空間。帶一件想完成的生活雜事來，大家一起開始、各自專心，50 分鐘後再回來看看進度。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/login" className="bg-[#FF5A36] px-7 py-3 text-base font-bold text-white hover:bg-ink">免費加入</ButtonLink>
            <ButtonLink href="#sessions" variant="outline" className="border-black/25 bg-white px-6 py-[.7rem] text-[.95rem]">看近期場次</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
