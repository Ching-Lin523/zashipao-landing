import { HomeSessionCardProps } from "./HomeSessionCard";
import { PersonalHomeSession } from "./PersonalHomeSession";

export function Features(props: HomeSessionCardProps) {
  return (
    <section id="features" className="bg-[#244D3D] px-[6%] py-24 text-white max-[720px]:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-[.9fr_1.1fr] items-center gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-12">
        <div>
          <p className="mb-5 text-sm font-bold text-[#F4C9B9]">下一場，就從一件事開始</p>
          <h2 className="rv font-serif text-[clamp(2.6rem,5vw,5rem)] font-black leading-[1.06]">
            不需要把人生<br />一次整理好。
          </h2>
          <p className="mt-7 max-w-[480px] text-lg leading-[1.8] text-white/70">
            預約一場、帶一件事來。有人陪你準時坐下來，剩下的就一小步一小步完成。
          </p>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-white/20 pt-8">
            <div>
              <div className="font-serif text-3xl font-black text-[#F4C9B9]">50</div>
              <div className="mt-1 text-sm text-white/60">分鐘安靜共做</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-black text-[#F4C9B9]">5</div>
              <div className="mt-1 text-sm text-white/60">人以內的小房間</div>
            </div>
          </div>
        </div>
        <div className="rv [&>div]:border-0 [&>div]:shadow-editorial">
          <PersonalHomeSession {...props} />
        </div>
      </div>
    </section>
  );
}
