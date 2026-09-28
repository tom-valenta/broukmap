export const ALLOWED_TAXON_RANKS = new Set(["species", "subspecies", "hybrid"]);

export type InaturalistTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string | null;
  rank: string;
  iconic_taxon_name?: string | null;
  ancestors?: { name: string; rank: string }[];
};

type TaxaResponse = { results?: InaturalistTaxon[] };

export async function fetchInaturalist(path: string, revalidate: number): Promise<InaturalistTaxon[]> {
  const response = await fetch(`https://api.inaturalist.org/v1${path}`, {
    headers: { Accept: "application/json", "User-Agent": "BugMap species picker" },
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`iNaturalist ${response.status}`);
  const payload = await response.json() as TaxaResponse;
  return Array.isArray(payload.results) ? payload.results : [];
}

export function isSelectableInsect(taxon: InaturalistTaxon) {
  return Number.isSafeInteger(taxon.id)
    && taxon.id > 0
    && taxon.iconic_taxon_name === "Insecta"
    && ALLOWED_TAXON_RANKS.has(taxon.rank)
    && typeof taxon.name === "string"
    && taxon.name.length >= 3
    && taxon.name.length <= 200;
}
