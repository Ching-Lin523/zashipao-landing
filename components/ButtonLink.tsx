import Link from "next/link";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "outline" | "white";

type ButtonLinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    variant?: ButtonVariant;
    className?: string;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-terracotta text-white hover:bg-terracotta-d hover:-translate-y-px",
  outline:
    "border-[1.5px] border-border bg-transparent text-ink hover:border-muted",
  white:
    "bg-white text-terracotta hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,.15)]"
};

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border-0 font-sans text-sm font-medium no-underline transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
