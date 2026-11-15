'use client';
import { useEffect, useRef, useState } from 'react';
import type { LocalVideoTrack } from 'livekit-client';

export function BackgroundBlurControl({ track, onChange }: { track?: LocalVideoTrack; onChange?: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    generation.current++;
    setEnabled(!!track?.getProcessor()); setError('');
    return () => { generation.current++; };
  }, [track]);
  return <div className="text-sm">
    <button type="button" aria-pressed={enabled} disabled={!track || pending} className="min-h-11 rounded-full border border-current/30 px-4 py-2 disabled:opacity-50" onClick={async () => {
      if (!track || busy.current) return;
      busy.current = true; setPending(true); setError('');
      const current = generation.current;
      try {
        if (enabled) await track.stopProcessor();
        else {
          const { BackgroundProcessor, supportsBackgroundProcessors } = await import('@livekit/track-processors');
          if (!supportsBackgroundProcessors()) throw new Error('UNSUPPORTED');
          if (current !== generation.current) return;
          await track.setProcessor(BackgroundProcessor({ mode: 'background-blur', blurRadius: 12 }));
        }
        if (current === generation.current) { setEnabled(!enabled); onChange?.(!enabled); }
        else await track.stopProcessor();
      } catch (e) {
        if (current === generation.current) setError((e as Error).message === 'UNSUPPORTED' ? '此瀏覽器不支援背景模糊，可改用新版 Chrome。' : '背景模糊未能套用，請關閉鏡頭或稍後重試。');
      } finally { busy.current = false; setPending(false); }
    }}>{pending ? '處理中…' : enabled ? '關閉背景模糊' : '模糊背景'}</button>
    {error && <p role="alert" className="mt-2 max-w-sm text-xs">{error}</p>}
  </div>;
}
