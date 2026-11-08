const taskExamples = [
  "預約牙醫",
  "取消訂閱",
  "申請退款",
  "整理帳單",
  "回覆訊息",
  "填完表格",
  "備份照片",
  "更新履歷"
];

export function Ticker() {
  return (
    <div className="overflow-hidden bg-ink py-3.5 text-white">
      <div className="flex w-max animate-tick">
        {[...taskExamples, ...taskExamples].map((item, index) => (
          <span className="flex shrink-0 items-center gap-3 px-10 text-sm text-white/75" key={`${item}-${index}`}>
            <span className="size-1.5 rounded-full bg-[#FF5A36]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
