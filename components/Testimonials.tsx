const testimonials = [
  {
    text: "更新護照放了兩個月。有人一起坐下來之後，那張表格居然一個晚上就填完了。",
    name: "思品",
    role: "行銷企劃，台北"
  },
  {
    text: "大家都安靜做自己的事，反而不會有社交壓力。只是知道有人也在努力，就比較坐得住。",
    name: "聖威",
    role: "軟體工程師，新竹"
  },
  {
    text: "最喜歡結束時那幾分鐘。不是比誰做得多，而是終於可以說：這件事有往前了。",
    name: "雅怡",
    role: "人資顧問，台中"
  }
];

export function Testimonials() {
  return (
    <section className="bg-[#FFFDF8] px-[6%] py-24 max-[720px]:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-[.8fr_1.2fr] gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <div>
            <p className="mb-4 text-sm font-bold text-[#C45F38]">一起做過的人說</p>
            <h2 className="font-serif text-[clamp(2.5rem,4.7vw,4.7rem)] font-black leading-[1.08]">
              有人一起，<br />開始就沒那麼難。
            </h2>
          </div>
          <div className="border-t border-black/20">
            {testimonials.map((testimonial, index) => (
              <figure className="rv grid grid-cols-[1fr_150px] gap-10 border-b border-black/20 py-8 max-[620px]:grid-cols-1 max-[620px]:gap-4" style={{ transitionDelay: `${index * 0.08}s` }} key={testimonial.name}>
                <blockquote className="font-serif text-xl font-bold leading-[1.6]">「{testimonial.text}」</blockquote>
                <figcaption className="text-sm leading-[1.6] text-ink/55">
                  <span className="block font-bold text-ink">{testimonial.name}</span>
                  {testimonial.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
