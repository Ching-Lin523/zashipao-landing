'use client';
import { useRouter } from 'next/navigation';
import { LeaveRoomButton } from './LeaveRoomButton';
import { BackgroundBlurControl } from './BackgroundBlurControl';
import { RoomChat } from './RoomChat';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, TrackToggle, StartAudio, useTracks, useConnectionState, useLocalParticipant } from '@livekit/components-react';
import { Room, Track, LocalVideoTrack } from 'livekit-client';
import '@livekit/components-styles';
import type { VideoCaptureOptions } from 'livekit-client';
import { videoRequest } from '@/lib/videoRequest';

function VideoTiles() {
  const { cameraTrack } = useLocalParticipant();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const state = useConnectionState();
  return <>
    <p role="status" className="mb-3 text-sm">{state === 'connected' ? `影音已連線 · ${tracks.length} 人` : state === 'reconnecting' ? '影音重新連線中…' : '影音連線中…'}</p>
    <div className={`room-tile-grid grid gap-3 ${tracks.length <= 1 ? 'grid-cols-1' : 'grid-cols-2 max-[480px]:grid-cols-1'}`}>{tracks.map(track => <ParticipantTile key={track.participant.identity} trackRef={track} className="aspect-video overflow-hidden rounded-xl border border-white/15" />)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><TrackToggle source={Track.Source.Camera} showIcon>鏡頭</TrackToggle><TrackToggle source={Track.Source.Microphone} showIcon>麥克風</TrackToggle><StartAudio label="開啟播放聲音" /><BackgroundBlurControl track={cameraTrack?.track instanceof LocalVideoTrack ? cameraTrack.track : undefined} /></div>
    <RoomAudioRenderer />
  </>;
}
export function SessionVideo({ sessionId, saving = false }: { sessionId: string; saving?: boolean }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string } | null>(null);
  const [capture, setCapture] = useState<boolean | VideoCaptureOptions>(false);
  const [preference, setPreference] = useState<{ enabled: boolean; blur: boolean } | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`room-camera:${sessionId}`);
      if (saved) {
        const value = JSON.parse(saved);
        if (typeof value.enabled === 'boolean' && Date.now() - value.at >= 0 && Date.now() - value.at < 300000) {
          setPreference({ enabled: value.enabled, blur: value.blur === true });
        }
      }
    } catch { /* Without a recent preview, return to the waiting room. */ }
  }, [sessionId]);
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
  const connect = useCallback(async () => {
      if (request.current || !preference) return;
      const controller = new AbortController(); request.current = controller; setPending(true); setError('');
      try {
        let options: boolean | VideoCaptureOptions = preference.enabled;
        if (preference.enabled && preference.blur) {
          const { BackgroundProcessor, supportsBackgroundProcessors } = await import('@livekit/track-processors');
          if (!supportsBackgroundProcessors()) { setError('此瀏覽器不支援背景模糊。請返回等候區調整設定後再進房。'); return; }
          options = { processor: BackgroundProcessor({ mode: 'background-blur', blurRadius: 12 }) };
        }
        const data = await videoRequest(sessionId, 'join', controller.signal);
        if (active.current && !controller.signal.aborted) { setCapture(options); setCredentials(data); try { sessionStorage.removeItem(`room-camera:${sessionId}`); } catch {} }
      } catch (e) {
        if (active.current && !controller.signal.aborted) setError((e as Error).message === 'VIDEO_NOT_CONFIGURED' ? '視訊服務尚未設定。' : '目前無法連線，請確認已登入、場次進行中，且尚未提前結束。');
      } finally { request.current = null; if (active.current) setPending(false); }

  }, [preference, sessionId]);
  useEffect(() => {
    if (!preference) return;
    // Defer until mount settles, so Strict Mode cannot start duplicate joins.
    const timer = window.setTimeout(() => { void connect(); }, 0);
    return () => clearTimeout(timer);
  }, [connect, preference]);
  return <section className="room-video min-w-0 text-white" aria-label="同場視訊">
    <h2 className="mb-2 font-bold">同場視訊</h2>
    <p className="mb-4 text-sm leading-6 text-white/70">鼓勵開著鏡頭，安靜陪伴彼此；不方便露臉也能參加。麥克風預設靜音。</p>
    {error ? <p role="alert" className="mb-3 rounded-xl border border-[#E7B59F]/40 p-3 text-sm text-[#FFD4C9]">{error}</p> : null}
    {credentials ? <div data-lk-theme="default" className="room-connection rounded-xl"><LiveKitRoom room={room} token={credentials.token} serverUrl={credentials.serverUrl} connect audio={false} video={capture}
      onDisconnected={() => { if (active.current) { setCredentials(null); setError('影音已離線。若在其他分頁連線，同帳號只會保留一個影音連線。'); } }}
      onError={() => setError('影音連線發生問題，請檢查網路後重新連線。')}
      onMediaDeviceFailure={() => setError('無法使用鏡頭或麥克風，請確認瀏覽器權限與裝置。仍可觀看其他人。')}>
      <VideoTiles />
      <RoomChat />

    </LiveKitRoom></div> : <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5 p-6 text-center">
      <p role="status" className="mb-3 font-bold">{pending ? '正在沿用等候區設定，加入房間…' : preference ? '連線已停止' : '請先在等候區確認鏡頭畫面'}</p>
      <p className="mb-4 text-sm text-white/70">鏡頭與背景模糊沿用剛剛的選擇，麥克風保持靜音。</p>
      {preference && !pending && <button className="min-h-11 rounded-full bg-forest px-5 text-sm font-bold" onClick={() => void connect()}>重新連線</button>}
      {!pending && <Link href={`/sessions/waiting/${sessionId}`} className="mt-4 text-sm underline">返回等候區調整設定</Link>}
    </div>}

    <LeaveRoomButton disabled={saving || pending} onLeave={async () => { active.current = false; request.current?.abort(); await room.disconnect(true); setCredentials(null); router.push('/my-sessions'); }} />
  </section>;
}
