import { LiveWaitingRoom } from '@/components/LiveWaitingRoom';
export const metadata = { title: '等候區 — 雜事房' };
export default function WaitingPage({ params }: { params: { id: string } }) {
  return <LiveWaitingRoom sessionId={params.id} />;
}
