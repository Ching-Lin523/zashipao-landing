'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/supabase/browser';
import { AccountMenu } from './AccountMenu';
import { Logo } from './Logo';

export function Navbar() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = browserAuth().auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const links = signedIn ? [
    { href: '/sessions', label: '可預約場次' },
    { href: '/my-sessions', label: '我的場次' },
    { href: '/tasks', label: '待辦清單' }
  ] : [
    { href: '/#how', label: '怎麼運作' },
    { href: '/#sessions', label: '場次' }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#FFFDF8]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-6 px-[5%]">
        <Logo />
        <div className="flex min-w-0 items-center justify-end gap-6 max-[760px]:gap-3">
          <nav aria-label="主要導覽" className="flex min-w-0 items-center gap-6 max-[760px]:hidden">
            {signedIn === null ? (
              <span className="text-sm text-ink/45" role="status">載入中…</span>
            ) : links.map(link => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center whitespace-nowrap text-sm text-ink/65 no-underline transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
          <AccountMenu />
        </div>

      </div>
    </header>
  );
}
