export function LineBand() {
  return (
    <div className="border-y border-black/15 bg-[#FFFDF8] px-[6%] py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-7 max-[720px]:items-start">
        <div className="flex items-center gap-5 max-[520px]:items-start">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#06C755] text-sm font-black text-white">LINE</div>
          <div>
            <div className="font-bold">場次快開始時，提醒你回來</div>
            <div className="mt-1 text-sm text-ink/55">加入 LINE 官方帳號，開場前收到通知。</div>
          </div>
        </div>
        <a href="/login" className="whitespace-nowrap border-b border-ink pb-1 text-sm font-bold text-ink no-underline max-[520px]:hidden">
          加入 LINE
        </a>
      </div>
    </div>
  );
}
