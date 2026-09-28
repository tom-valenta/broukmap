import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SightingCard from "@/components/sightings/SightingCard";
export default async function HelpVerifyPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  const params = await searchParams; const page = Math.max(1, Math.floor(Number(params.page) || 1)); const size = 24;
  const result = user ? await db.from("help_verify").select("*", { count: "exact" }).order("like_count", { ascending: false }).order("created_at", { ascending: false }).order("id").range((page - 1) * size, page * size - 1) : null;
  return <section className="flex-1 bg-stone-50 px-5 py-10 text-stone-900 dark:bg-slate-950 dark:text-slate-100"><div className="mx-auto max-w-7xl space-y-6"><Link href="/map" className="underline">← Mapa</Link><h1 className="text-3xl font-bold">Pomoz určit druh</h1><p>Nálezy s více lajky jsou výše. Přeskočené a již určené nálezy se ti nevracejí.</p>{!user ? <Link href="/login" className="underline">Přihlas se a pomoz ostatním s určením.</Link> : result?.error ? <p role="alert">Frontu se nepodařilo načíst. Obnov stránku.</p> : <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result?.data?.map(s => <SightingCard key={s.id} sighting={s} />)}</div>{!result?.data?.length && <p>Žádné další nálezy k určení.</p>}<nav aria-label="Stránkování" className="flex gap-5">{page > 1 && <Link href={`/help-verify?page=${page - 1}`} className="underline">Předchozí</Link>}{page * size < (result?.count ?? 0) && <Link href={`/help-verify?page=${page + 1}`} className="underline">Další</Link>}</nav></>}</div></section>;
}
