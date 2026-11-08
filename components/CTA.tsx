import { ButtonLink } from "./ButtonLink";

export function CTA() {
  return (
    <section className="bg-[#FF5A36] px-[6%] py-24 text-ink max-[720px]:py-16">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-14 max-[800px]:block">
        <div>
          <p className="mb-5 text-sm font-bold">有件事，已經想很久了嗎？</p>
          <h2 className="max-w-[780px] font-serif text-[clamp(3rem,6.5vw,7rem)] font-black leading-[.98]">
            這次，一起<br />開始就好。
          </h2>
        </div>
        <div className="max-w-[340px] shrink-0 max-[800px]:mt-10">
          <p className="mb-7 text-base leading-[1.75] text-ink/70">
            不用先變得很有自制力。選一場適合的時間，帶著那件事進來。
          </p>
          <ButtonLink href="/login" className="bg-ink px-8 py-3.5 text-base font-bold text-white hover:bg-[#244D3D]">
            免費加入雜事房
          </ButtonLink>
          <div className="mt-4 text-sm text-ink/55">不用下載，打開瀏覽器就能參加</div>
        </div>
      </div>
    </section>
  );
}
