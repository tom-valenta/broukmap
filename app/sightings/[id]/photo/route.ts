import { createClient } from "@/lib/supabase/server";
import { sightingPhotoPath } from "@/lib/sighting-photo";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
const accessRequests = new Map<string, Promise<string[]>>();
const SIGNED_URL_TTL_SECONDS = 90;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const query = new URL(request.url).searchParams;
  const fail = (status: number) => new Response("Fotografie není dostupná.", { status, headers: { "Cache-Control": "no-store" } });
  // Coalesce only concurrent checks for the same session and sighting. Every
  // later request still executes Storage RLS before receiving a signed URL.
  const accessKey = createHash("sha256").update(`${id}:${request.headers.get("cookie") ?? ""}`).digest("hex");
  let access = accessRequests.get(accessKey);
  if (!access) {
    access = (async () => {
      const { data: gallery, error } = await supabase.from("sighting_photo_sets").select("paths").eq("sighting_id", id).maybeSingle();
      if (error) throw error;
      if (gallery) return gallery.paths;
      const { data: visible, error: legacyError } = await supabase.from("public_sightings").select("photo_url").eq("id", id).maybeSingle();
      if (legacyError) throw legacyError;
      return visible?.photo_url ? [visible.photo_url] : [];
    })().finally(() => { accessRequests.delete(accessKey); });
    accessRequests.set(accessKey, access);
  }
  let paths: string[];
  try { paths = await access; } catch { return fail(503); }
  const requested = query.get("photo");
  const path = sightingPhotoPath((requested === null ? paths[0] : paths.find(item => item === requested)) ?? null);
  if (!path) return fail(404);
  const width = query.get("w");
  const size = width === "320" ? 320 : width === "640" ? 640 : width === "960" ? 960 : width === "1280" ? 1280 : undefined;
  const { data, error } = await supabase.storage.from("sighting-photos").createSignedUrl(path, SIGNED_URL_TTL_SECONDS, {
    transform: size ? { width: size, quality: 75 } : undefined,
  });
  if (error || !data?.signedUrl) return fail(503);
  return new Response(null, {
    status: 307,
    headers: {
      "Location": data.signedUrl,
      // Keep the redirect shorter than the signed URL. The browser never gets
      // a durable shared cache entry for a photo whose visibility can change.
      "Cache-Control": "private, max-age=60, must-revalidate",
      "Vary": "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
