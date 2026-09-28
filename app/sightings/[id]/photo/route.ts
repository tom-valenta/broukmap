import { createClient } from "@/lib/supabase/server";
import { sightingPhotoPath } from "@/lib/sighting-photo";

export const runtime = "edge";
const SIGNED_URL_TTL_SECONDS = 90;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const query = new URL(request.url).searchParams;
  const fail = (status: number) => new Response("Fotografie není dostupná.", { status, headers: { "Cache-Control": "no-store" } });
  let paths: string[];
  try {
    // Photo-set SELECT RLS enforces private/hidden/owner/admin access before
    // the Edge function creates a Storage signed URL.
    const { data: gallery, error } = await supabase.from("sighting_photo_sets").select("paths").eq("sighting_id", id).maybeSingle();
    if (error) throw error;
    if (gallery) paths = gallery.paths;
    else {
      const { data: visible, error: legacyError } = await supabase.from("public_sightings").select("photo_url").eq("id", id).maybeSingle();
      if (legacyError) throw legacyError;
      paths = visible?.photo_url ? [visible.photo_url] : [];
    }
  } catch { return fail(503); }
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
