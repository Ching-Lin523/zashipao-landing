import { LiveSessionRoom } from '@/components/LiveSessionRoom';
export const metadata = { title: '共事房間 — 雜事房' };
export default function RoomPage({ params }: { params: { id: string } }) {
  return <LiveSessionRoom sessionId={params.id} />;
}
