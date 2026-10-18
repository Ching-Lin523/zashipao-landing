'use client';
import { useSharedTasks } from './useSharedTasks';
export function TaskSyncStatus() {
  const [, , sync] = useSharedTasks();
  return <div className="my-3 text-sm text-muted" role={sync.error ? 'alert' : 'status'}>
    {sync.error ? <>{sync.error} <button type="button" className="font-bold text-terracotta underline" onClick={() => void sync.reload()}>重新載入</button></>
      : sync.loading ? '正在載入你的待辦…' : sync.saving ? '正在儲存到雲端…' : sync.userId ? '待辦已同步至個人帳號' : '請先登入以讀取待辦。'}
  </div>;
}
