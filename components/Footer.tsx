import { Logo } from "./Logo";

const footerLinks = [
  ["關於我們", "/about"],
  ["使用條款", "/terms"],
  ["隱私政策", "/privacy"],
  ["聯絡我們", "/contact"]
] as const;

export function Footer() {
  return (
    <footer className="flex items-center justify-between gap-4 bg-ink px-[6%] py-9 text-sm text-white/45 max-[900px]:flex-col max-[900px]:text-center">
      <Logo dark />
      <div className="flex gap-6 max-[720px]:flex-wrap max-[720px]:justify-center">
        {footerLinks.map(([label, href]) => (
          <a className="text-white/40 no-underline transition-colors hover:text-white/70" href={href} key={label}>
            {label}
          </a>
        ))}
      </div>
      <span>© 2026 雜事房 · 線上共做空間</span>
    </footer>
  );
}
