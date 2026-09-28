/* eslint-disable @next/next/no-img-element -- Protected photos bypass the shared image optimizer cache. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import ModerationActions from "@/components/ModerationActions";
import ResolveSpeciesForm from "@/components/sightings/ResolveSpeciesForm";

export default async function AdminSightingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [sightingResult, reportResult, summaryResult] = await Promise.all([
    supabase.from("sightings").select("*").eq("id", id).maybeSingle(),
    supabase.from("reports").select("*").eq("sighting_id", id).is("reviewed_at", null).order("created_at").limit(100),
    supabase.from("admin_report_queue").select("*").eq("sighting_id", id).maybeSingle(),
  ]);
  if (sightingResult.error || reportResult.error || summaryResult.error) throw new Error("Nález nebo reporty se nepodařilo načíst.");
  const sighting = sightingResult.data;
  if (!sighting) notFound();
  const reports = reportResult.data ?? [];
  const summary = summaryResult.data;
  return <section className="flex-1 bg-stone-50 px-5 py-10 text-stone-900 dark:bg-slate-950 dark:text-slate-100">
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin" className="text-emerald-700 underline dark:text-emerald-400">← Fronta reportů</Link>
      <h1 className="break-all text-2xl font-bold">Nález {id}</h1>
      {sighting.photo_url && <a href={`/sightings/${id}/photo`} target="_blank" rel="noreferrer"><img src={`/sightings/${id}/photo?w=1280`} alt="Fotografie nálezu ke kontrole" className="max-h-96 rounded-2xl object-contain" /></a>}
      <p>Stav: <strong>{sighting.status}</strong> · určení: {sighting.id_status} · soukromí: {sighting.geoprivacy}</p>
      <p className={sighting.obfuscation_radius_m > 100 ? "rounded-xl bg-amber-100 p-3 font-bold text-amber-950" : "text-sm"}>{sighting.obfuscation_radius_m > 100 ? `Ochrana druhu: rozšířený poloměr ${sighting.obfuscation_radius_m / 1000} km` : "Běžné rozmazání: 100 m"}{sighting.geoprivacy === "private" ? " · bez veřejného pinu" : ""}</p>
      <p>Datum nálezu: {sighting.found_date} · přesná poloha: {sighting.latitude}, {sighting.longitude}</p>
      <p className="whitespace-pre-wrap">{sighting.notes || "Bez poznámky."}</p>
      {sighting.reported_sensitive && <p className="rounded-xl bg-amber-100 p-4 text-amber-950">Priorita: autor označil možný citlivý druh.</p>}
      {(sighting.id_status === "disputed" || (sighting.id_status === "confirmed" && !sighting.species_id)) && <ResolveSpeciesForm id={id} name={sighting.species_name_text} />}
      <Link href={`/sightings/${id}`} className="inline-block text-emerald-700 underline dark:text-emerald-400">Detail nálezu</Link>
      <h2 className="text-xl font-semibold">{summary?.report_count ?? 0} reportů od {summary?.reporter_count ?? 0} unikátních uživatelů</h2>
      <p>{summary?.pending_count ?? 0} nevyřízených reportů od {summary?.pending_reporter_count ?? 0} lidí</p>
      <ul className="space-y-3">{reports.map(report => <li key={report.id} className="rounded-xl border p-4 dark:border-slate-700">
        <p className="whitespace-pre-wrap break-words">{report.reason}</p>
        <p className="mt-2 break-all text-xs text-stone-500 dark:text-slate-400">Uživatel {report.user_id} · {new Date(report.created_at).toLocaleString("cs-CZ")}</p>
      </li>)}</ul>
      {reports.length === 100 && <p>Zobrazeno nejstarších 100 nevyřízených reportů. Akce vyřídí pouze tyto reporty.</p>}
      <ModerationActions id={id} reportIds={reports.map(r => r.id)} hidden={sighting.status === "hidden"} />
    </div>
  </section>;
}
