import { createClient } from "@/lib/supabase/server";
import { sightingPhotoPath } from "@/lib/sighting-photo";
import { PhotoCache } from "@/lib/photo-cache";
import sharp from "sharp";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
type Source = { bytes: Uint8Array; type: string };
type Photo = Source & { etag: string };
// UUID upload paths are immutable. Cache bytes longer, NOT access permissions.
// Share the original download between 320/640/1280 variants and concurrent requests.
const originals = new PhotoCache<Source>(64 * 1024 * 1024, 3600000, value => value.bytes.byteLength);
const variants = new PhotoCache<Photo>(64 * 1024 * 1024, 3600000, value => value.bytes.byteLength);
const accessRequests = new Map<string, Promise<string[]>>();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const started = performance.now();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const query = new URL(request.url).searchParams;
  const fail = (status: number) => new Response("Fotografie není dostupná.", { status, headers: { "Cache-Control": "no-store" } });
  // Coalesce only concurrent checks for the SAME session/post. Never reuse an
  // authorization result after completion, or between logged-in users.
  const accessKey = createHash("sha256").update(`${id}:${request.headers.get("cookie") ?? ""}`).digest("hex");
  let access = accessRequests.get(accessKey);
  if (!access) {
    access = (async () => {
      // Photo-set SELECT RLS already enforces private/hidden/owner/admin access.
      const { data: gallery, error } = await supabase.from("sighting_photo_sets").select("paths").eq("sighting_id", id).maybeSingle();
      if (error) throw error;
      if (gallery) return gallery.paths;
      // Legacy single-photo posts have no set; use their existing safe projection.
      const { data: visible, error: legacyError } = await supabase.from("public_sightings").select("photo_url").eq("id", id).maybeSingle();
      if (legacyError) throw legacyError;
      return visible?.photo_url ? [visible.photo_url] : [];
    })().finally(() => { accessRequests.delete(accessKey); });
    accessRequests.set(accessKey, access);
  }
  let paths: string[];
  try { paths = await access; } catch { return fail(503); }
  const accessMs = performance.now() - started;
  const requested = query.get("photo");
  const path = sightingPhotoPath((requested === null ? paths[0] : paths.find(item => item === requested)) ?? null);
  if (!path) return fail(404);
  const width = query.get("w");
  const size = width === "320" ? 320 : width === "640" ? 640 : width === "960" ? 960 : width === "1280" ? 1280 : null;
  let photo: Photo;
  try {
    photo = await variants.get(`${path}:${size ?? "original"}`, async () => {
      const source = await originals.get(path, async () => {
        const { data, error } = await supabase.storage.from("sighting-photos").download(path);
        if (error || !data) throw new Error("Photo download failed");
        return { bytes: new Uint8Array(await data.arrayBuffer()), type: data.type };
      });
      let { bytes, type } = source;
      if (size) {
        try {
          bytes = new Uint8Array(await sharp(bytes).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer());
          type = "image/webp";
        } catch { /* Preserve original delivery for older unsupported formats. */ }
      }
      return { bytes, type, etag: `"${createHash("sha256").update(bytes).digest("hex")}"` };
    });
  } catch { return fail(503); }
  const headers = {
    "Content-Type": photo.type,
    // Keep the existing short browser privacy window; server bytes live longer
    // but EVERY response (including 304/cache hits) passes current RLS above.
    "Cache-Control": "private, max-age=60, must-revalidate",
    "ETag": photo.etag,
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff",
    "Server-Timing": `access;dur=${accessMs.toFixed(1)}, image;dur=${(performance.now() - started - accessMs).toFixed(1)}`,
  };
  if (request.headers.get("if-none-match") === photo.etag) return new Response(null, { status: 304, headers });
  return new Response(new Blob([new Uint8Array(photo.bytes)], { type: photo.type }), { headers });
}
