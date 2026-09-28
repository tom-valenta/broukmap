/* eslint-disable @next/next/no-img-element -- Protected photos bypass shared image caching. */
import Link from "next/link";
import { CheckCircle2, Bug, MapPin, CalendarDays } from "lucide-react";
import { sightingName, statusLabel, type Sighting } from "@/lib/sightings";
import SightingLocality from "@/components/sightings/SightingLocality";

function scientificNameOnly(value: string | null) {
  if (!value) return "";
  const withoutAuthority = value.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return withoutAuthority.match(/^[A-ZÀ-Ž][\p{L}-]+\s+[a-zà-ž][\p{Ll}-]+(?:\s+(?:(?:subsp\.|ssp\.|var\.)\s+)?[a-zà-ž][\p{Ll}-]+)?/u)?.[0]
    || withoutAuthority.replace(/[,\s]+\d{4}.*$/, "");
}

export function ProfileFindingCard({ sighting, locality }: { sighting: Sighting; authorName?: string; locality?: string | null }) {
  const latinName = scientificNameOnly(sighting.scientific_name);
  const name = sighting.common_name || latinName || sightingName(sighting);
  const confirmed = sighting.id_status === "confirmed";
  const date = sighting.found_date ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(sighting.found_date)) : "Datum neuvedeno";
  const place = locality || <SightingLocality id={sighting.id} restricted={sighting.geoprivacy === "private" || sighting.status === "hidden"} />;
  return <Link href={`/sightings/${sighting.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-slate-800 dark:bg-slate-900">
    <div className="relative aspect-video overflow-hidden bg-stone-200 dark:bg-slate-800">
      {sighting.photo_url ? <img src={`/sightings/${sighting.id}/photo?w=640`} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Bug aria-label="Fotografie není dostupná" className="size-12 text-slate-400" /></div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      {confirmed && <span title="Potvrzeno komunitou" className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-950/90 px-2 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm"><CheckCircle2 aria-hidden="true" className="size-3.5" />Ověřeno</span>}
    </div>
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="min-w-0 flex-1 break-words text-xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">{name}</h3>
          {sighting.family && <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500 dark:text-slate-400">{sighting.family}</span>}
        </div>
        {latinName && <p className="mt-1 text-sm italic text-stone-500 dark:text-slate-400">{latinName}</p>}
      </div>
      {sighting.notes && <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-stone-600 dark:text-slate-300">{sighting.notes}</p>}
      {(!confirmed || sighting.status === "hidden" || sighting.geoprivacy === "private") && <p className="text-xs text-stone-500 dark:text-slate-400">{[!confirmed && statusLabel(sighting.id_status), sighting.status === "hidden" && "Skrytý administrátorem", sighting.geoprivacy === "private" && "Soukromý nález"].filter(Boolean).join(" · ")}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2 text-xs text-stone-600 dark:text-slate-300">
        <span className="inline-flex min-w-0 items-center gap-1.5" title={sighting.geoprivacy === "obscured" ? "Přibližná lokalita" : undefined}><MapPin aria-hidden="true" className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="break-words">{place}</span></span>
        <time dateTime={sighting.found_date || undefined} className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-stone-400 dark:text-slate-400" />{date}</time>
      </div>
    </div>
  </Link>;
}

