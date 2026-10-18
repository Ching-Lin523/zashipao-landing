export type PublicSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
};

export async function getPublicSessions(): Promise<PublicSession[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  const endpoint = new URL("/rest/v1/rpc/list_available_sessions", url);
  const response = await fetch(endpoint, {
    headers: { apikey: key },
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Session request failed: ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(item =>
    typeof item.id === "string" && typeof item.title === "string" &&
    typeof item.starts_at === "string" && Number.isFinite(Date.parse(item.starts_at)) &&
    typeof item.ends_at === "string" && Number.isFinite(Date.parse(item.ends_at)) &&
    Number.isInteger(item.capacity) && item.capacity > 0 && item.capacity <= 5 && Number.isInteger(item.booked_count) && item.booked_count >= 0
  )) throw new Error("Invalid session response");
  return data;
}
