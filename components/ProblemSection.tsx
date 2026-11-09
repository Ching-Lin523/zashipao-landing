const reasons = [
  { number: "01", title: "讓目標往前一點", detail: "寫一頁、讀一章，接著做那件一直想完成的事。" },
  { number: "02", title: "找回自己的節奏", detail: "當日子有點散，從一個準時坐下來的約定開始。" },
  { number: "03", title: "留一段安靜的時間", detail: "暫時放下外界的催促，專心照顧眼前的一件事。" },
  { number: "04", title: "處理生活雜事", detail: "回信、整理帳單、預約看診，把零碎的小事一件件整理好。" }
];

export function ProblemSection() {
  return (
    <section aria-labelledby="our-belief" className="bg-[#FAF7F2] px-[6%] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="mb-5 flex items-center gap-3 text-sm font-bold tracking-widest text-forest"><span className="h-px w-8 bg-forest" />為什麼有雜事房</p>
            <h2 id="our-belief" className="scroll-mt-24 font-serif text-[clamp(2.1rem,4vw,3.6rem)] font-black leading-[1.3] text-ink">
              生活裡，<br />總有些事<br /><span className="text-terracotta">被擱在一旁。</span>
            </h2>
            <div className="mt-6 max-w-lg space-y-5 text-base leading-8 text-muted">
              <p>有些事想了很久，卻一直沒有開始。<br />有些事做了一半，又被生活打斷。</p>
              <p>也有些時候，我們沒有什麼遠大的目標，只是想安靜下來，把堆著的小事整理好，讓心裡輕一點。</p>
              <p className="border-l-2 border-terracotta pl-5 text-forest">雜事房，就是讓你為這些事留一段時間的地方。和幾個人一起坐下，各自專注，從今天做得到的一點開始。</p>
            </div>
          </div>
          <div className="rounded-[28px] border border-[#DDD6CB] bg-[#FFFDF8] p-6 sm:p-8">
            <p className="mb-2 text-sm font-bold text-muted">今天的你，可以從這裡開始</p>
            {reasons.map((reason) => (
              <div className="flex gap-4 border-b border-border py-5 last:border-0 last:pb-0" key={reason.number}>
                <span aria-hidden="true" className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F3E4DA] font-serif text-sm font-bold text-terracotta">{reason.number}</span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{reason.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-4 border-t border-[#CEC9BD] pt-7 md:grid-cols-[1fr_1.2fr] md:gap-12">
          <p className="font-serif text-xl font-bold leading-relaxed text-ink">不用跟上誰的進度，<br />也不必一次完成。</p>
          <p className="text-sm leading-7 text-muted">有時是推進一個目標，有時只是少了一件牽掛。每一次願意開始，都在慢慢找回自己的生活節奏。</p>
        </div>
      </div>
    </section>
  );
}
