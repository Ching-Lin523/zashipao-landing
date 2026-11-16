'use client';
import { useRouter } from 'next/navigation';
import { LeaveRoomButton } from './LeaveRoomButton';
import { DemoRoomChat } from './RoomChat';
import Link from 'next/link';
import { useState } from 'react';
import { RoomWorkspace, RoomTaskProgress } from './RoomWorkspace';
import { Logo } from './Logo';

export function RoomLayoutDemo() {
  const router = useRouter();
  const [done, setDone] = useState<number[]>([]);
  const tasks = ['補齊所得稅延期申報資料', '預約牙醫洗牙', '回覆房東確認維修時間'];
  return <main className="room-page min-h-screen bg-cream px-3 py-5 sm:px-[4%] sm:py-8">
    <div className="room-page-inner mx-auto max-w-[1400px]">
      <Logo />
      <div className="my-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Link href="/my-sessions">← 返回已預約場次</Link>
        <p>介面預覽 · 人物與倒數為示意，不連接影音、不儲存資料</p>
      </div>
      <RoomWorkspace title="晚間雜事衝刺" schedule="21:00–21:50（台灣時間）" timer="49:55"
        video={<>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">同場視訊</h2><span className="text-sm text-white/70">4 人示意</span></div>
          <div className="room-tile-grid grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
            {['你','芯','岳','婷'].map((name,i) => <div key={name} className={`relative flex aspect-video items-center justify-center rounded-lg border bg-white/5 ${i===0?'border-coral':'border-white/15'}`}>
              <div className="text-center"><span className={`mx-auto flex size-16 items-center justify-center rounded-lg text-xl font-bold ${['bg-paper text-ink','bg-cream text-forest','bg-cream text-ink','bg-cream text-ink'][i]}`}>{name}</span><p className="mt-3 text-sm">{name}</p><p className="mt-1 text-xs text-white/65">鏡頭關閉 · 示意</p></div>
            </div>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{['鏡頭','麥克風','模糊背景'].map(label=><button key={label} disabled className="min-h-11 rounded-lg border border-white/20 bg-white/5 px-5 text-sm text-white/60">{label}</button>)}</div>
          <p className="mt-4 text-xs leading-6 text-white/65">鼓勵開著鏡頭，安靜陪伴彼此；不方便露臉也能參加。實際連線時，麥克風預設靜音。</p>
          <LeaveRoomButton preview onLeave={() => router.push('/my-sessions')} />
          <DemoRoomChat />
        </>}>
        <RoomTaskProgress completed={done.length} total={tasks.length} />
        <p className="mb-4 text-xs leading-6 text-muted">試著勾選下方待辦，查看完成進度。</p>
        <div className="grid gap-3">{tasks.map((title,id)=><label key={id} className="flex items-start gap-3 rounded-lg border border-border bg-paper p-3">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-forest" checked={done.includes(id)} onChange={()=>setDone(current=>current.includes(id)?current.filter(n=>n!==id):[...current,id])}/>
          <span className={`min-w-0 break-words text-sm leading-6 ${done.includes(id)?'text-muted line-through':''}`}>{title}</span>
        </label>)}</div>
        <p className="mt-5 text-xs leading-6 text-muted">離開後，只要場次尚未結束，都可以再加入；場次結束後可查看成果。</p>
      </RoomWorkspace>
    </div>
  </main>;
}
