// Only server-created, explicitly marked session rooms are eligible for deletion.
export type ManagedRoom = { name: string; metadata: string };
export function expiredVideoRoom(room: ManagedRoom, now: number): boolean {
  if (!/^session-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(room.name)) return false;
  try {
    const metadata = JSON.parse(room.metadata);
    const end = typeof metadata.endsAt === 'string' ? Date.parse(metadata.endsAt) : NaN;
    return metadata.app === 'zashipao' && metadata.version === 1 && metadata.sessionId === room.name.slice(8) && Number.isFinite(end) && end <= now;
  } catch { return false; }
}
export async function cleanupVideoRooms(service: { listRooms(): Promise<ManagedRoom[]>; deleteRoom(name: string): Promise<unknown> }, now = Date.now()) {
  const rooms = await service.listRooms();
  let deleted = 0, failed = 0;
  for (const room of rooms) {
    if (!expiredVideoRoom(room, now)) continue;
    try { await service.deleteRoom(room.name); deleted++; }
    catch { failed++; } // Keep the next scheduled run able to retry.
  }
  return { inspected: rooms.length, deleted, failed };
}
