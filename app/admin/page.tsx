/* eslint-disable @next/next/no-img-element -- Protected photos bypass the shared image optimizer cache. */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-role";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: queue, error } = await supabase.from("admin_report_queue")
    .select("*").gt("pending_count", 0).order("oldest_pending_at").limit(100);
  const [unpaired, disputed, sensitive] = await Promise.all([
    supabase.from("sightings").select("id,species_name_text,geoprivacy,obfuscation_radius_m").eq("id_status", "confirmed").is("species_id", null).order("created_at").limit(100),
    supabase.from("sightings").select("id,species_name_text,geoprivacy,obfuscation_radius_m").eq("id_status", "disputed").order("created_at").limit(100),
    supabase.from("sightings").select("id,species_name_text,geoprivacy,obfuscation_radius_m").gt("obfuscation_radius_m", 100).order("created_at", { ascending: false }).limit(100),
  ]);
  return <section className="flex-1 bg-stone-50 px-5 py-10 text-stone-900 dark:bg-slate-950 dark:text-slate-100">
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-3xl font-bold">Nahlášené nálezy</h1>
      {[{ title: "Priorita: možné citlivé druhy", result: sensitive }, { title: "Confirmed bez species_id", result: unpaired }, { title: "Sporná určení", result: disputed }].map(section => <section key={section.title} className="space-y-3 rounded-2xl border p-5 dark:border-slate-700">
        <h2 className="text-xl font-semibold">{section.title}</h2>
        {section.result.error ? <p role="alert">Frontu se nepodařilo načíst.</p> : !section.result.data?.length ? <p className="text-sm">Žádné nálezy.</p> : <ul className="space-y-2">{section.result.data.map(s => <li key={s.id}><Link className="break-all text-emerald-700 underline dark:text-emerald-400" href={`/admin/sightings/${s.id}`}>{s.species_name_text || "Neurčený nález"} · {s.id}</Link>{s.obfuscation_radius_m > 100 && <span className="ml-2 rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-950">Ochrana druhu · {s.obfuscation_radius_m / 1000} km{s.geoprivacy === "private" ? " · soukromý" : ""}</span>}</li>)}</ul>}
        {section.result.data?.length === 100 && <p>Zobrazeno prvních 100 záznamů.</p>}
      </section>)}
      <p>Reporty nálezy automaticky neskrývají. Rozhodnutí je vždy na administrátorovi.</p>
      {error ? <p role="alert">Frontu se nepodařilo načíst. Zkus stránku obnovit.</p> : !queue?.length ? <p>Žádná nevyřízená hlášení.</p> : <ul className="space-y-4">
        {queue.map(item => <li key={item.sighting_id} className="flex flex-wrap gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {item.photo_url && <img src={`/sightings/${item.sighting_id}/photo?w=320`} alt="Nahlášený nález" className="h-24 w-24 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Link href={`/admin/sightings/${item.sighting_id}`} className="break-all font-semibold text-emerald-700 underline dark:text-emerald-400">Nález {item.sighting_id}</Link>
            <p><strong>{item.report_count}</strong> reportů od <strong>{item.reporter_count}</strong> unikátních uživatelů celkem</p>
            <p>{item.pending_count} nevyřízených reportů od {item.pending_reporter_count} lidí · stav: {item.status}</p>
          </div>
        </li>)}
      </ul>}
      {queue?.length === 100 && <p>Zobrazeno prvních 100 nálezů podle nejstaršího hlášení. Po vyřízení se zobrazí další.</p>}
      <form action="/admin/sighting" className="flex flex-wrap gap-3 border-t pt-6 dark:border-slate-800">
        <label htmlFor="sighting-id" className="w-full font-medium">Spravovat nález i bez reportu</label>
        <input id="sighting-id" name="id" required placeholder="ID nálezu (UUID)" className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 dark:bg-slate-900" />
        <button className="min-h-11 rounded-xl bg-emerald-700 px-4 text-white">Otevřít</button>
      </form>
    </div>
  </section>;
}

