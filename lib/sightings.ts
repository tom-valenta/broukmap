import type { Database } from "@/lib/supabase/database.types";
export type Sighting = Database["public"]["Views"]["public_sightings"]["Row"];
export type Guess = { speciesId: string | null; text: string };
export function locationLabel(s: { geoprivacy: string | null; obfuscation_radius_m: number | null }) {
  if (s.geoprivacy === "private") return "Soukromá poloha — jen autor a admin";
  if (s.geoprivacy === "open") return "Veřejná přesná poloha";
  const radius = s.obfuscation_radius_m ?? 100;
  return radius > 100 ? `Přibližná poloha (± ${radius / 1000} km) — chráněný nebo možný citlivý druh` : "Přibližná poloha (± 100 m)";
}
export const statusLabel = (status: string | null) => status === "confirmed" ? "Potvrzeno komunitou" : status === "disputed" ? "Sporné určení" : "Čeká na určení";
export const sightingName = (s: Pick<Sighting, "common_name" | "scientific_name" | "species_name_text">) => s.common_name || s.scientific_name || s.species_name_text || "Neurčený nález";
export const fieldClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]";
export const buttonClass = "min-h-11 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50";
const MAX_PHOTO_INPUT_BYTES = 30 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Re-encode through canvas so no original EXIF/GPS metadata is uploaded. */
export async function prepareSightingPhoto(file: File): Promise<Blob> {
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error("Fotografie je příliš velká (max. 30 MB).");
  const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  if (!isHeic && !ALLOWED_PHOTO_TYPES.includes(file.type)) throw new Error("Podporované formáty jsou JPG, PNG, WebP, HEIC a HEIF.");
  let source: Blob = file;
  if (isHeic) {
    try {
      const { default: convert } = await import("heic2any");
      const converted = await convert({ blob: file, toType: "image/jpeg", quality: 0.9 });
      source = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      throw new Error("Fotku ve formátu HEIC/HEIF se nepodařilo převést.");
    }
  }
  const bitmap = await createImageBitmap(source);
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fotografii se nepodařilo zpracovat.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Fotografii se nepodařilo zpracovat.")), "image/jpeg", 0.85));
    if (blob.size > 5 * 1024 * 1024) throw new Error("Fotografie je příliš velká. Vyber menší snímek.");
    return blob;
  } finally { bitmap.close(); }
}
