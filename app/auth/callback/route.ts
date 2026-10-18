import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { authRedirect } from '@/lib/authRedirect';
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3002';
  const code = request.nextUrl.searchParams.get('code');
  const response = NextResponse.redirect(new URL(authRedirect(request.nextUrl.searchParams.get('next')), origin));
  response.headers.set('Cache-Control', 'private, no-store');
  if (code) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      }
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', origin));
}
