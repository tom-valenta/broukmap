import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchInaturalist, isSelectableInsect } from "@/lib/inaturalist";
import { clientRateLimitKey, rateLimitHeaders, takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 15;

function reply(data: unknown, status = 200, cache = false, headers: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": cache && status === 200 ? "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800" : "no-store", ...headers },
  });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return reply({ results: [] }, 200, true);
  const limit = 30;
  const quota = takeRateLimit(`species-search:${clientRateLimitKey(request)}`, { limit, windowMs: 60_000 });
  if (!quota.allowed) return reply({ error: "Too many requests" }, 429, false, rateLimitHeaders(quota, limit));
  try {
    // Never use earlier BugMap selections to rank or populate guesses. This
    // keeps identifications independent; the local catalogue is used only
    // after the user selects an authoritative iNaturalist taxon.
    const remoteTaxa = await fetchInaturalist(`/taxa/autocomplete?q=${encodeURIComponent(query)}&locale=cs&per_page=20`, 86400);
    const seen = new Set<string>();
    const results = [];
    for (const taxon of remoteTaxa.filter(isSelectableInsect)) {
      const key = taxon.name.toLocaleLowerCase("cs");
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ speciesId: null, taxonId: taxon.id, scientificName: taxon.name, commonName: taxon.preferred_common_name ?? null, family: null, rank: taxon.rank });
    }
    return reply({ results: results.slice(0, 12) }, 200, true);
  } catch {
    return reply({ error: "Catalogue unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { taxonId?: unknown };
    const taxonId = Number(body.taxonId);
    if (!Number.isSafeInteger(taxonId) || taxonId <= 0) return reply({ error: "Invalid taxon" }, 400);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return reply({ error: "Sign in required" }, 401);
    const limit = 12;
    const quota = takeRateLimit(`species-register:${user.id}`, { limit, windowMs: 60_000 });
    if (!quota.allowed) return reply({ error: "Too many requests" }, 429, false, rateLimitHeaders(quota, limit));

    const taxon = (await fetchInaturalist(`/taxa/${taxonId}?locale=cs`, 604800))[0];
    if (!taxon || !isSelectableInsect(taxon)) return reply({ error: "Taxon is not a selectable insect species" }, 400);
    const family = taxon.ancestors?.find(ancestor => ancestor.rank === "family")?.name ?? null;
    const { data: speciesId, error } = await supabase.rpc("register_inaturalist_species", {
      p_taxon_id: taxon.id,
      p_scientific_name: taxon.name,
      p_common_name: taxon.preferred_common_name ?? undefined,
      p_family: family ?? undefined,
      p_rank: taxon.rank,
    });
    if (error) throw error;
    return reply({ speciesId, scientificName: taxon.name, commonName: taxon.preferred_common_name ?? null, family, rank: taxon.rank });
  } catch {
    return reply({ error: "Species could not be saved" }, 503);
  }
}
