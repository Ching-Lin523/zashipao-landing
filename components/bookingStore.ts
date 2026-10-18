import { upcomingSessions } from "./sessionData";
export type Booking = typeof upcomingSessions[number];
const key = "zashipao:bookings:v1";
export function readBookings(): Booking[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (Array.isArray(saved)) return [...upcomingSessions, ...saved.filter(b => b && typeof b.id === "string" && typeof b.date === "string" && typeof b.time === "string" && Array.isArray(b.taskIds) && Array.isArray(b.tasks))];
  } catch {}
  return upcomingSessions;
}
export function saveBooking(booking: Booking) {
  const bookings = readBookings().filter(b => !upcomingSessions.some(d => d.id === b.id) && b.id !== booking.id);
  localStorage.setItem(`zashipao:session-task-ids:${booking.date}-${booking.time}`, JSON.stringify(booking.taskIds));
  localStorage.setItem(key, JSON.stringify([...bookings, booking]));
  window.dispatchEvent(new Event("zashipao-session-tasks"));
}
