'use client';
import { useEffect, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, TrackToggle, StartAudio, useTracks, useConnectionState } from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { videoRequest } from '@/lib/videoRequest';

function VideoTiles() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const state = useConnectionState();
  return <>
    <p role="status" className="mb-3 text-sm">{state === 'connected' ? `影音已連線 · ${tracks.length} 人` : state === 'reconnecting' ? '影音重新連線中…' : '影音連線中…'}</p>
    <div className="grid grid-cols-2 gap-2 max-[480px]:grid-cols-1">{tracks.map(track => <ParticipantTile key={track.participant.identity} trackRef={track} className="aspect-video overflow-hidden rounded-xl" />)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><TrackToggle source={Track.Source.Camera} showIcon>鏡頭</TrackToggle><TrackToggle source={Track.Source.Microphone} showIcon>麥克風</TrackToggle><StartAudio label="開啟播放聲音" /></div>
    <RoomAudioRenderer />
  </>;
}
export function SessionVideo({ sessionId }: { sessionId: string }) {
  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const leave = () => { request.current?.abort(); void room.disconnect(true); setCredentials(null); };
    window.addEventListener('pagehide', leave);
    return () => { active.current = false; request.current?.abort(); void room.disconnect(true); window.removeEventListener('pagehide', leave); };
  }, [room]);
  useEffect(() => {
    if (!credentials) return;
    let stopped = false, checking = false;
    const controller = new AbortController();
    const check = async () => {
      if (checking) return; checking = true;
      try { await videoRequest(sessionId, 'check', controller.signal); }
      catch { if (!stopped) { void room.disconnect(true); setCredentials(null); setError('無法確認場次資格，影音已中斷。請重新連線。'); } }
      finally { checking = false; }
    };
    const timer = window.setInterval(check, 15000);
    window.addEventListener('focus', check);
    return () => { stopped = true; controller.abort(); clearInterval(timer); window.removeEventListener('focus', check); };
  }, [credentials, room, sessionId]);
  return <section className="my-6 rounded-xl border border-border p-4" aria-label="同場視訊">
    <h2 className="mb-2 font-bold">同場視訊</h2>
    <p className="mb-4 text-sm text-muted">連線後可看到同場夥伴。鏡頭與麥克風預設關閉，由你決定何時開啟。</p>
    {error ? <p role="alert" className="mb-3 text-sm text-terracotta">{error}</p> : null}
    {credentials ? <div data-lk-theme="default" className="rounded-xl p-3"><LiveKitRoom room={room} token={credentials.token} serverUrl={credentials.serverUrl} connect audio={false} video={false}
      onDisconnected={() => { if (active.current) { setCredentials(null); setError('影音已離線。若在其他分頁連線，同帳號只會保留一個影音連線。'); } }}
      onError={() => setError('影音連線發生問題，請檢查網路後重新連線。')}
      onMediaDeviceFailure={() => setError('無法使用鏡頭或麥克風，請確認瀏覽器權限與裝置。仍可觀看其他人。')}>
      <VideoTiles />
      <button className="mt-3 rounded-full border px-4 py-2 text-sm" onClick={() => { void room.disconnect(true); setCredentials(null); }}>中斷影音</button>
    </LiveKitRoom></div> : <button disabled={pending} className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={async () => {
      if (request.current) return;
      const controller = new AbortController(); request.current = controller; setPending(true); setError('');
      try {
        const data = await videoRequest(sessionId, 'join', controller.signal);
        if (active.current && !controller.signal.aborted) setCredentials(data);
      } catch (e) {
        if (active.current && !controller.signal.aborted) setError((e as Error).message === 'VIDEO_NOT_CONFIGURED' ? '視訊服務尚未設定。' : '目前無法連線，請確認已登入、場次進行中，且尚未提前結束。');
      } finally { request.current = null; if (active.current) setPending(false); }
    }}>{pending ? '正在連線…' : '連接同場視訊'}</button>}
  </section>;
}
