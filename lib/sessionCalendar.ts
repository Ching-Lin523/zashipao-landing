export type CalendarSession = { id: string; title: string; starts_at: string; ends_at: string };

export function calendarOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}
function stamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
function details(session: CalendarSession, origin: string | null) {
  return '等候區於開場前 5 分鐘開放。' + (origin ? `\n進入等候區：${origin}/sessions/waiting/${encodeURIComponent(session.id)}` : '\n請回雜事房「已預約場次」進入等候區。') + '\n取消預約或改期後，請自行更新此行事曆活動。';
}
export function googleCalendarUrl(session: CalendarSession, origin: string | null) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: `雜事房｜${session.title}`, dates: `${stamp(session.starts_at)}/${stamp(session.ends_at)}`, details: details(session, origin), ctz: 'Asia/Taipei' });
  return `https://calendar.google.com/calendar/render?${params}`;
}
const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
// RFC 5545 lines are folded by UTF-8 octets, without splitting characters.
function fold(line: string) {
  let result = '', bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result += '\r\n '; bytes = 1; }
    result += char; bytes += size;
  }
  return result;
}
export function sessionIcs(session: CalendarSession, origin: string | null, now = new Date()) {
  if (Date.parse(session.ends_at) <= Date.parse(session.starts_at)) throw new Error('Invalid session duration');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zashipao//Session Calendar//ZH-TW', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${encodeURIComponent(session.id)}@zashipao`, `DTSTAMP:${stamp(now.toISOString())}`, `DTSTART:${stamp(session.starts_at)}`, `DTEND:${stamp(session.ends_at)}`, `SUMMARY:${escapeText(`雜事房｜${session.title}`)}`, `DESCRIPTION:${escapeText(details(session, origin))}`, 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}
