import { createClient as createPublicClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fetchInaturalist, isSelectableInsect } from "@/lib/inaturalist";

export const runtime = "nodejs";
export const maxDuration = 15;

type LocalSpecies = {
  id: string;
  scientific_name: string;
  common_name: string | null;
  family: string | null;
  inaturalist_taxon_id: number | null;
  taxon_rank: string | null;
};

function publicDb() {
  return createPublicClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function reply(data: unknown, status = 200, cache = false) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": cache && status === 200 ? "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800" : "no-store" },
  });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return reply({ results: [] }, 200, true);
  const localNeedle = query.replace(/[%_(),.*]/g, " ").trim();

  try {
    const [localSettled, remoteSettled] = await Promise.allSettled([
      publicDb().from("species")
        .select("id,scientific_name,common_name,family,inaturalist_taxon_id,taxon_rank")
        .or(`scientific_name.ilike.%${localNeedle}%,common_name.ilike.%${localNeedle}%`)
        .order("scientific_name")
        .limit(12),
      fetchInaturalist(`/taxa/autocomplete?q=${encodeURIComponent(query)}&locale=cs&per_page=20`, 86400),
    ]);
    const localResult = localSettled.status === "fulfilled" ? localSettled.value : null;
    const remoteTaxa = remoteSettled.status === "fulfilled" ? remoteSettled.value : [];
    if ((!localResult || localResult.error) && remoteSettled.status === "rejected") throw new Error();
    const local = (localResult?.data ?? []) as LocalSpecies[];
    const byTaxon = new Map(local.filter(row => row.inaturalist_taxon_id).map(row => [row.inaturalist_taxon_id, row]));
    const seen = new Set<string>();
    const results = [];

    for (const row of local) {
      const key = row.scientific_name.toLocaleLowerCase("cs");
      seen.add(key);
      results.push({ speciesId: row.id, taxonId: row.inaturalist_taxon_id, scientificName: row.scientific_name, commonName: row.common_name, family: row.family, rank: row.taxon_rank ?? "species" });
    }
    for (const taxon of remoteTaxa.filter(isSelectableInsect)) {
      const key = taxon.name.toLocaleLowerCase("cs");
      if (seen.has(key)) continue;
      seen.add(key);
      const cached = byTaxon.get(taxon.id);
      results.push({ speciesId: cached?.id ?? null, taxonId: taxon.id, scientificName: taxon.name, commonName: taxon.preferred_common_name ?? null, family: cached?.family ?? null, rank: taxon.rank });
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
