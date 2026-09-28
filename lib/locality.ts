import "server-only";
import { createHash } from "node:crypto";
import { mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// All app instances must use the same persistent directory (see docs/localities.md).
export async function lookupLocality(latitude: number, longitude: number): Promise<string | null> {
  if (process.env.NODE_ENV === "production" && !process.env.GEOCODING_CACHE_DIR) throw new Error("Geocoding storage not configured");
  const directory = process.env.GEOCODING_CACHE_DIR || path.join(process.cwd(), ".cache", "geocoding");
  const endpoint = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/reverse";
  const key = createHash("sha256").update(`${endpoint}:cs:15:${latitude}:${longitude}`).digest("hex");
  const filename = path.join(directory, `${key}.json`);
  await mkdir(directory, { recursive: true });
  async function cached(): Promise<{ locality: string | null } | null> {
    try { return JSON.parse(await readFile(filename, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  }
  const existing = await cached();
  if (existing) return existing.locality;
  const lockPath = path.join(directory, "provider.lock");
  const deadline = Date.now() + 12000;
  let lock;
  while (!lock) {
    try { lock = await open(lockPath, "wx"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || Date.now() >= deadline) throw error;
      await pause(200);
    }
  }
  try {
    const existing = await cached();
    if (existing) return existing.locality;
    const url = new URL(endpoint);
    url.search = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "jsonv2", zoom: "15", layer: "address", "accept-language": "cs", addressdetails: "1" }).toString();
    try {
      const response = await fetch(url, { headers: { "User-Agent": "BroukMap/1.0 (insect-sighting locality lookup)", Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
      const data = await response.json();
      const address = data.address || {};
      const locality = [address.city, address.town, address.village, address.hamlet, address.municipality].find(value => typeof value === "string" && value.trim()) || null;
      if (data.error && !String(data.error).includes("Unable to geocode")) throw new Error("Geocoder response error");
      await writeFile(filename, JSON.stringify({ locality }), "utf8");
      return locality;
    } finally {
      // Keep the shared lock for a full second AFTER the request, including failures.
      await pause(1100);
    }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
