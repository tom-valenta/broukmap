export type MapFilters = {
  period: "today" | "day" | "year" | "all";
  day: string;
  year: string;
  dateField: "created_at" | "found_date";
  status: "all" | "confirmed" | "needs_id" | "disputed";
  species: { id: string; label: string }[];
};

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
