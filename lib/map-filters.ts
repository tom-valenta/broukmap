export type MapFilters = {
  period: "today" | "day" | "year" | "all";
  day: string;
  year: string;
  dateField: "created_at" | "found_date";
  status: "all" | "confirmed" | "needs_id" | "disputed";
  species: { id: string; label: string }[];
};

export function defaultMapFilters(today: string): MapFilters {
  return { period: "today", day: today, year: today.slice(0, 4), dateField: "created_at", status: "all", species: [] };
}

/** Keeps map links reproducible without trusting arbitrary URL values. */
export function mapFiltersFromSearch(search: URLSearchParams, today: string): MapFilters {
  const fallback = defaultMapFilters(today);
  const period = search.get("period");
  const dateField = search.get("dateField");
  const status = search.get("status");
  let species: MapFilters["species"] = [];
  try {
    const candidate = JSON.parse(search.get("species") || "[]");
    if (Array.isArray(candidate)) species = candidate.filter((item): item is { id: string; label: string } => !!item && typeof item.id === "string" && typeof item.label === "string" && (item.id.startsWith("text:") || /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(item.id))).slice(0, 12).map(item => ({ id: item.id.slice(0, 100), label: item.label.slice(0, 80) }));
  } catch { /* Invalid links fall back to no species filter. */ }
  return {
    period: period === "day" || period === "year" || period === "all" || period === "today" ? period : fallback.period,
    day: /^\d{4}-\d{2}-\d{2}$/.test(search.get("day") || "") ? search.get("day")! : fallback.day,
    year: /^\d{4}$/.test(search.get("year") || "") ? search.get("year")! : fallback.year,
    dateField: dateField === "found_date" || dateField === "created_at" ? dateField : fallback.dateField,
    status: status === "confirmed" || status === "needs_id" || status === "disputed" || status === "all" ? status : fallback.status,
    species,
  };
}

export function mapFiltersSearch(filters: MapFilters, today: string): string {
  const defaults = defaultMapFilters(today);
  const search = new URLSearchParams();
  if (filters.period !== defaults.period) search.set("period", filters.period);
  if (filters.period === "day" && filters.day !== defaults.day) search.set("day", filters.day);
  if (filters.period === "year" && filters.year !== defaults.year) search.set("year", filters.year);
  if (filters.dateField !== defaults.dateField) search.set("dateField", filters.dateField);
  if (filters.status !== defaults.status) search.set("status", filters.status);
  if (filters.species.length) search.set("species", JSON.stringify(filters.species.map(({ id, label }) => ({ id, label }))));
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function mapDateRange(filters: MapFilters, today: string): { from: string; until: string } | null {
  if (filters.period === "all") return null;
  const day = filters.period === "today" ? today : filters.day;
  const year = filters.period === "year" ? Number(filters.year) : Number(day.slice(0, 4));
  if (!Number.isInteger(year) || year < 1900 || year > 9998) throw new Error("Vyber platný rok.");
  const month = filters.period === "year" ? 1 : Number(day.slice(5, 7));
  const date = filters.period === "year" ? 1 : Number(day.slice(8, 10));
  const start = new Date(year, month - 1, date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.period === "year" ? `${year}-01-01` : day) || start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== date) throw new Error("Vyber platné datum.");
  const end = filters.period === "year" ? new Date(year + 1, 0, 1) : new Date(year, month - 1, date + 1);
  const localDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  // Publication timestamps use local midnight (including DST). Observation dates
  // are SQL dates and must not be shifted through UTC.
  return filters.dateField === "created_at" ? { from: start.toISOString(), until: end.toISOString() } : { from: localDate(start), until: localDate(end) };
}

/** Only catalog UUIDs and literal words enter the PostgREST OR expression. */
export function mapSpeciesExpression(species: MapFilters["species"]): string | null {
  const ids = species.filter(item => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)).map(item => item.id);
  const text = species.filter(item => item.id.startsWith("text:")).map(item => item.id.slice(5).replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 80)).filter(Boolean);
  const parts = [...(ids.length ? [`species_id.in.(${ids.join(",")})`] : []), ...text.map(word => `species_name_text.ilike.*${word}*`)];
  return parts.length ? parts.join(",") : null;
}
