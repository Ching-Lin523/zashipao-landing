import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    number: "1",
    icon: "✍️",
    iconClass: "bg-terracotta-lt",
    title: "帶一件一直拖著的事情進來",
    description: "不用是什麼大事。整理照片、預約看診、處理退貨，或任何一件心頭上的待辦事項",
    details: ["你只需要決定：這場想處理哪一件。", "不用先想清楚完整計畫，先進來開始就好。"]
  },
  {
    number: "2",
    icon: "📣",
    iconClass: "bg-forest-lt",
    title: "開場前，說出這場要完成什麼",
    description: "進場後先公開承諾。你會看到其他人也在處理自己的雜事，大家一起把時間空出來。",
    details: ["承諾不用很正式，說清楚今天要推進什麼就可以。", "別人也會說自己的目標，所以你不會覺得只有自己在拖。"]
  },
  {
    number: "3",
    icon: "✓",
    iconClass: "bg-amberish-lt",
    title: "50 分鐘專心處理，結束回報成果",
    description: "時間到就回報這場完成到哪裡。做完很好，沒全做完也至少往前推了一步。",
    details: ["做完就打勾封存，沒做完也可以留下下一步。", "重點不是變得超有效率，是讓事情真的往前一點。"]
  }
];

export function HowItWorks() {
  return (
    <section id="how" className="px-[6%] py-22">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          label="怎麼運作"
          title="替那些一直拖著沒做的事，安排一段真的會開始的時間"
          subtitle="雜事房不是要你變成時間管理達人。它只是把一件你一直拖著的生活雜事，放進一場 50 分鐘、有人一起開始的線上共做。"
        />
        <div className="relative mt-12 grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
          <div className="absolute left-[calc(33.33%_+_0.5rem)] top-10 h-0.5 w-[calc(33.33%_-_1rem)] bg-border max-[900px]:hidden" />
          <div className="absolute left-[calc(66.66%_+_0.5rem)] top-10 h-0.5 w-[calc(33.33%_-_1rem)] bg-border max-[900px]:hidden" />
          {steps.map((step, index) => (
            <div
              className="rv relative rounded-2xl border-[1.5px] border-border bg-white p-8 transition-all duration-200 hover:border-terracotta hover:shadow-soft"
              style={{ transitionDelay: `${index * 0.12}s` }}
              key={step.number}
            >
              <div className="absolute right-6 top-6 select-none font-serif text-6xl font-black leading-none text-cream-d">{step.number}</div>
              <div className={`mb-5 flex size-11 items-center justify-center rounded-xl text-xl ${step.iconClass}`}>{step.icon}</div>
              <div className="mb-2 font-serif text-[1.05rem] font-bold">{step.title}</div>
              <p className="text-sm leading-[1.65] text-muted">{step.description}</p>
              <details className="group mt-5 border-t border-cream-d pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-terracotta">
                  再多看一點
                  <span className="text-base leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <ul className="mt-3 flex list-none flex-col gap-2 text-[.78rem] leading-[1.55] text-muted">
                  {step.details.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <span className="mt-[.45rem] size-1.5 shrink-0 rounded-full bg-terracotta/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
