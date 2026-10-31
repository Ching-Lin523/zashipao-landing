import Link from "next/link";

type LogoProps = {
  dark?: boolean;
};

export function Logo({ dark = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap font-serif text-xl font-black no-underline ${dark ? "text-white" : "text-ink"}`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-[7px] text-xs font-black text-white ${dark ? "bg-white/10" : "bg-terracotta"}`}
      >
        雜
      </span>
      雜事房
    </Link>
  );
}
