import Link from 'next/link';
import { CloudBooking } from '@/components/CloudBooking';
import { getPublicSessions } from '@/lib/publicSessions';
export const metadata = { title: '選擇本場雜事 — 雜事房' };
export const dynamic = 'force-dynamic';
export default async function BookSessionPage({ searchParams }: { searchParams: { session?: string; tasks?: string } }) {
  let sessions;
  try { sessions = await getPublicSessions(); }
  catch { return <main className="p-8">場次暫時無法載入。<Link href="/sessions" className="underline">返回場次列表重試</Link></main>; }
  const session = sessions.find(s => s.id === searchParams.session);
  if (!session) return <main className="p-8">請先選擇一場尚未開始的活動。<Link href="/sessions" className="underline">查看可預約場次</Link></main>;
  return <CloudBooking session={session} initialIds={(searchParams.tasks ?? '').split(',').map(Number).filter(id => Number.isSafeInteger(id) && id > 0)} />;
}
