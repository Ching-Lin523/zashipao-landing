'use client';
import { useEffect, useState } from 'react';
import { calendarOrigin, googleCalendarUrl, sessionIcs, type CalendarSession } from '@/lib/sessionCalendar';

export function AddToCalendar({ session }: { session: CalendarSession }) {
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => { setOrigin(calendarOrigin(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)); }, []);
  return <details className="my-4 rounded-xl border border-border bg-cream p-4">
    <summary className="cursor-pointer text-sm font-bold text-forest">加入行事曆</summary>
    <div className="mt-3 flex flex-wrap gap-2">
      <a href={googleCalendarUrl(session, origin)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold">Google Calendar ↗</a>
      <button type="button" className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold" onClick={() => {
        const url = URL.createObjectURL(new Blob([sessionIcs(session, origin)], { type: 'text/calendar;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = `zashipao-${session.id}.ics`;
        document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      }}>Apple／Outlook（下載 .ics）</button>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-muted">請在行事曆確認儲存並設定提醒。取消預約或改期不會自動同步，請自行更新；重複加入可能產生重複活動。</p>
    {!origin ? <p className="mt-2 text-xs text-muted">本機測試的行程不附網站連結；正式部署後再驗證等候區連結。</p> : null}
  </details>;
}
