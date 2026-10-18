import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  const protectedPath = ['/tasks', '/my-sessions', '/sessions/book'].includes(request.nextUrl.pathname) || ((request.nextUrl.pathname.startsWith('/sessions/waiting/') || request.nextUrl.pathname.startsWith('/sessions/room/')) && !request.nextUrl.pathname.endsWith('/demo'));
  if (!user && protectedPath) {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3002');
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    const redirect = new NextResponse(null, { status: 307, headers: { Location: url.toString(), "Cache-Control": "private, no-store" } });
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/tasks', '/my-sessions', '/sessions/:path*'] };
