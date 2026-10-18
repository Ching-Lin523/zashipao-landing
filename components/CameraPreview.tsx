'use client';
import { useEffect, useRef, useState } from 'react';

/** Local-only preview. A stream is never published or retained across navigation. */
export function CameraPreview() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const stop = () => {
    ++generation.current;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  };
  useEffect(() => {
    const leave = () => { stop(); setEnabled(false); setPending(false); };
    window.addEventListener('pagehide', leave);
    return () => { stop(); window.removeEventListener('pagehide', leave); };
  }, []);
  const start = async () => {
    const token = ++generation.current;
    setPending(true); setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('UNSUPPORTED');
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      media.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (token !== generation.current) return;
        stop(); setEnabled(false); setPending(false); setError('攝影機已中斷，可以重新開啟。');
      }, { once: true }));
      if (video.current) { video.current.srcObject = media; await video.current.play(); }
      if (token === generation.current) setEnabled(true);
    } catch (e) {
      if (token !== generation.current) return;
      stop(); setEnabled(false); setPending(false);
      const name = (e as Error).name;
      setError(name === 'NotAllowedError' ? '未取得攝影機權限。可以在瀏覽器設定中允許後再試，也可以不開鏡頭。' : name === 'NotFoundError' ? '找不到攝影機，仍可繼續進房。' : '目前無法開啟攝影機，請確認裝置沒有被其他程式占用，或稍後再試。');
    } finally { if (token === generation.current) setPending(false); }
  };
  return <section aria-label="進房前鏡頭預覽" className="my-6 rounded-xl border border-border p-4">
    <h2 className="font-bold">進房前，確認一下鏡頭</h2>
    <p className="mt-2 text-sm text-muted">這個預覽只有你看得到，不會傳給其他人。進房後可另外連接同場視訊，不開鏡頭也能參加。</p>
    <div className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-cream">
      <video ref={video} muted playsInline aria-label="自己的攝影機預覽" className={`h-full w-full -scale-x-100 object-cover ${enabled ? '' : 'invisible'}`} />
      {!enabled ? <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">{pending ? '等待攝影機授權…' : '鏡頭已關閉'}</p> : null}
    </div>
    <button type="button" aria-pressed={enabled} className="mt-4 min-h-11 rounded-full border border-border px-5 py-2 text-sm" onClick={() => {
      if (enabled || pending) { stop(); setEnabled(false); setPending(false); setError(''); }
      else void start();
    }}>{pending ? '取消預覽' : enabled ? '關閉鏡頭' : '開啟鏡頭預覽'}</button>
    {error ? <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p> : null}
  </section>;
}
