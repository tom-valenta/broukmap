import "server-only";

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let nextProviderRequest = 0;

// Coordinates passed here have already been read from the public projection.
// The fetch cache is durable on Vercel, unlike the serverless filesystem.
export async function lookupLocality(latitude: number, longitude: number): Promise<string | null> {
  const endpoint = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/reverse";
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "jsonv2", zoom: "15", layer: "address", "accept-language": "cs", addressdetails: "1" }).toString();
  const wait = nextProviderRequest - Date.now();
  if (wait > 0) await pause(wait);
  nextProviderRequest = Date.now() + 1100;
  const response = await fetch(url, {
    headers: { "User-Agent": "BroukMap/1.0 (insect-sighting locality lookup)", Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 30 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
  const data = await response.json();
  const address = data.address || {};
  const locality = [address.city, address.town, address.village, address.hamlet, address.municipality].find(value => typeof value === "string" && value.trim()) || null;
  if (data.error && !String(data.error).includes("Unable to geocode")) throw new Error("Geocoder response error");
  return locality;
}
