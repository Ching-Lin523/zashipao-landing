import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "聯絡我們 — 雜事房" };

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream px-[5%] py-6">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <section className="mt-8 rounded-3xl border border-border bg-white p-6 sm:p-10">
          <h1 className="font-serif text-3xl font-black">聯絡我們</h1>
          <p className="mt-4 leading-relaxed text-muted">使用雜事房時遇到問題、有功能建議，或想申請刪除帳號，都可以寫信給我們。</p>
          <a className="mt-6 inline-flex min-h-11 max-w-full items-center rounded-full bg-terracotta px-6 py-3 font-bold text-white focus-visible:outline-forest" href="mailto:steph4mat@gmail.com?subject=%E9%9B%9C%E4%BA%8B%E6%88%BF%E4%BD%BF%E7%94%A8%E5%8D%94%E5%8A%A9">寫信給雜事房</a>
          <p className="mt-3 break-all text-sm text-muted">steph4mat@gmail.com</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">按鈕會開啟你的郵件程式；若沒有開啟，也可以複製上方信箱自行寄信。</p>
          <h2 className="mt-8 text-lg font-bold">來信時可以提供</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">
            <li>遇到問題的頁面、操作步驟與發生時間。</li>
            <li>相關場次的名稱與日期；需要時可附上遮住私人資訊的截圖。</li>
            <li>若申請刪除帳號，請使用註冊信箱來信，我們會先確認本人意願再處理。</li>
          </ul>
          <p className="mt-5 text-sm text-muted">請勿提供密碼、驗證碼或金鑰。</p>
        </section>
        <nav aria-label="返回網站" className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="inline-flex min-h-11 items-center underline" href="/">回到首頁</Link>
          <Link className="inline-flex min-h-11 items-center underline" href="/my-sessions">已預約場次</Link>
          <Link className="inline-flex min-h-11 items-center underline" href="/tasks">我的待辦清單</Link>
        </nav>
      </div>
    </main>
  );
}
