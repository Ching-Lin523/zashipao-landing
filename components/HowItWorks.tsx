const steps = [
  {
    number: "01",
    title: "選一個時間",
    description: "挑一場適合的 50 分鐘，先替那件一直被延後的事留個位置。"
  },
  {
    number: "02",
    title: "說好這場要做什麼",
    description: "開場時簡單交代目標。每個人做的事不同，但會在同一刻一起開始。"
  },
  {
    number: "03",
    title: "安靜做，最後再碰面",
    description: "中間各自專心，結束時回來分享進度。做多少，都算真的往前了一點。"
  }
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-[#FFFDF8] px-[6%] py-24 max-[720px]:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex items-end justify-between gap-10 max-[800px]:block">
          <div>
            <p className="mb-4 text-sm font-bold text-[#C45F38]">怎麼運作</p>
            <h2 className="rv font-serif text-[clamp(2.4rem,4.5vw,4.8rem)] font-black leading-[1.08]">
              一起開始，<br />各自完成。
            </h2>
          </div>
          <p className="max-w-[440px] text-base leading-[1.75] text-ink/60 max-[800px]:mt-6">
            不用準備完整計畫，也不用一路聊天。你只需要帶一件想推進的事進來。
          </p>
        </div>
        <div className="border-t border-black/20">
          {steps.map((step, index) => (
            <div
              className="rv grid grid-cols-[90px_1fr_1.1fr] items-center gap-8 border-b border-black/20 py-9 max-[720px]:grid-cols-[58px_1fr] max-[720px]:gap-4"
              style={{ transitionDelay: `${index * 0.08}s` }}
              key={step.number}
            >
              <span className="font-serif text-2xl font-black text-[#C45F38]">{step.number}</span>
              <h3 className="font-serif text-2xl font-bold max-[720px]:text-xl">{step.title}</h3>
              <p className="text-base leading-[1.7] text-ink/60 max-[720px]:col-start-2">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
