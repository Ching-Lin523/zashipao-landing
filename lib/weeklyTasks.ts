/** Weeks start Monday, consistently in Taiwan time regardless of browser timezone. */
export function taipeiWeek(now = new Date(), offset = 0): string {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7 + offset * 7);
  return date.toISOString().slice(0, 10);
}
