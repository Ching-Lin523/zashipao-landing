"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  minLength?: number;
};

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          required
          className="w-full rounded-xl border-[1.5px] border-border bg-cream py-3 pl-4 pr-14 text-base outline-none transition-colors placeholder:text-light focus:border-terracotta"
        />
        <button
          type="button"
          aria-label={`${visible ? "隱藏" : "顯示"}${label}`}
          aria-controls={id}
          title={`${visible ? "隱藏" : "顯示"}${label}`}
          onClick={() => setVisible(value => !value)}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-cream-d hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta"
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path d="m3 3 18 18" /> : null}
          </svg>
        </button>
      </div>
    </div>
  );
}
