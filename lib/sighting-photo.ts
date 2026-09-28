/** Accept only paths in our bucket, never fetch user-controlled remote URLs. */
export function sightingPhotoPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.includes("://")) return value.startsWith("/") ? null : value;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return null;
    const prefix = "/storage/v1/object/public/sighting-photos/";
    return url.pathname.startsWith(prefix)
      ? decodeURIComponent(url.pathname.slice(prefix.length))
      : null;
  } catch {
    return null;
  }
}
