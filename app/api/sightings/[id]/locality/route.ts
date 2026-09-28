import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { lookupLocality } from "@/lib/locality";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reply = (locality: string | null, status = 200) => Response.json({ locality }, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return reply(null, 400);
  // Deliberately no cookies/session/service key: even owners get PUBLIC coordinates.
  const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("public_sightings").select("latitude,longitude,geoprivacy,status").eq("id", id).maybeSingle();
  if (error) return reply(null, 503);
  if (!data || data.geoprivacy === "private" || !["pending", "approved"].includes(data.status || "")) return reply(null, 404);
  if (data.latitude == null || data.longitude == null) return reply(null);
  try { return reply(await lookupLocality(data.latitude, data.longitude)); }
  catch { return reply(null, 503); }
}
