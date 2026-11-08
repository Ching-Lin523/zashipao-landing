const thoughts = [
  "那封信晚點再回",
  "牙醫下週再約",
  "表格有空再填",
  "照片改天再整理"
];

export function ProblemSection() {
  return (
    <section className="bg-[#DDEEF2] px-[6%] py-24 max-[720px]:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-[1.1fr_.9fr] gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-12">
        <div>
          <p className="mb-5 text-sm font-bold text-[#244D3D]">我們都不是不想做</p>
          <h2 className="rv max-w-[720px] font-serif text-[clamp(2.6rem,5vw,5.4rem)] font-black leading-[1.06] text-ink">
            只是生活裡，<br />總有些事很難開始。
          </h2>
        </div>
        <div className="flex flex-col justify-end">
          <p className="max-w-[500px] text-lg leading-[1.8] text-ink/75">
            它們不一定很難，也不一定很急。只是每次都被更重要的事擠到後面，久了便一直掛在心上。
          </p>
          <div className="mt-9 border-t border-ink/20">
            {thoughts.map((thought) => (
              <div className="flex items-center justify-between border-b border-ink/20 py-3.5 text-sm font-medium" key={thought}>
                <span>{thought}</span>
                <span className="text-ink/40">改天</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
