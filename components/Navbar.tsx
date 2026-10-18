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
    { href: '/my-sessions', label: '已預約場次' },
    { href: '/tasks', label: '我的待辦清單' }
  ] : [
    { href: '/#how', label: '怎麼運作' },
    { href: '/#features', label: '功能' },
    { href: '/#sessions', label: '可預約場次' }
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/95 backdrop-blur-xl">
      <div className="grid min-h-[62px] grid-cols-[auto_1fr_auto] items-center gap-x-6 gap-y-2 px-[6%] py-2 max-[900px]:grid-cols-[1fr_auto]">
        <Logo />
        <nav aria-label="首頁主要導覽" className="flex min-w-0 items-center justify-end gap-1 max-[900px]:order-3 max-[900px]:col-span-2 max-[900px]:justify-start max-[900px]:overflow-x-auto">
          {signedIn === null ? <span className="py-2 text-sm text-muted" role="status">載入導覽中…</span> : links.map(link => (
            <Link key={link.href} href={link.href} className="shrink-0 rounded-full px-3 py-3 text-sm text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-terracotta">{link.label}</Link>
          ))}
        </nav>
        <div className="justify-self-end"><AccountMenu /></div>
      </div>
    </header>
  );
}
