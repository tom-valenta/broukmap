/* eslint-disable @next/next/no-img-element -- Protected photo endpoint must bypass shared image caching. */
import Link from "next/link";
import { sightingName, statusLabel, type Sighting } from "@/lib/sightings";
export default function SightingCard({ sighting }: { sighting: Sighting }) {
  return <Link href={`/sightings/${sighting.id}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
    {sighting.photo_url && <img src={`/sightings/${sighting.id}/photo?w=640`} alt="Fotografie nálezu" loading="lazy" className="aspect-video w-full object-cover" />}
    <div className="space-y-2 p-4"><p className={`text-xs font-semibold ${sighting.id_status === "confirmed" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>{statusLabel(sighting.id_status)}</p><h3 className="text-lg font-bold">{sightingName(sighting)}</h3><p className="text-sm">{sighting.found_date} · {sighting.geoprivacy === "private" ? "Soukromý" : sighting.geoprivacy === "obscured" ? "Poloha rozmazaná" : "Veřejná poloha"}{sighting.status === "hidden" ? " · Skrytý administrátorem" : ""}</p><p className="text-sm text-stone-500">♡ {sighting.like_count ?? 0}</p></div>
  </Link>;
}

