import SightingGallery from "@/components/sightings/SightingGallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldAlert, Sparkles, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReportSightingForm from "@/components/ReportSightingForm";
import IdentificationPanel from "@/components/sightings/IdentificationPanel";
import LikeButton from "@/components/sightings/LikeButton";
import NotesEditor from "@/components/sightings/NotesEditor";
import DeleteSightingButton from "@/components/sightings/DeleteSightingButton";
import SightingLocality from "@/components/sightings/SightingLocality";
import UserAvatar from "@/components/UserAvatar";
import { getProfileById } from "@/lib/user";
import { locationLabel, sightingName, statusLabel } from "@/lib/sightings";

function formatDate(value: string | null) {
  if (!value) return "Datum neuvedeno";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export default async function SightingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { id } = await params;
  const { from } = await searchParams;
  const mapHref = from === "/map" || from?.startsWith("/map?") ? from : "/map";
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: s, error } = await db.from("public_sightings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Nález se nepodařilo načíst.");
  if (!s) notFound();

  const { data: gallery, error: galleryError } = await db.from("sighting_photo_sets").select("paths").eq("sighting_id", id).maybeSingle();
  if (galleryError) throw new Error("Fotografie se nepodařilo načíst.");
  const photoPaths = gallery?.paths ?? (s.photo_url ? [s.photo_url] : []);
  const author = s.user_id ? await getProfileById(s.user_id) : null;

  const [identifications, skips, likes] = await Promise.all([
    db.from("identifications").select("id,user_id,species_id,species_name_text,species(common_name,scientific_name)").eq("sighting_id", id).order("created_at"),
    user ? db.from("user_skips").select("sighting_id").eq("sighting_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    user ? db.from("sighting_likes").select("sighting_id").eq("sighting_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (identifications.error || skips.error || likes.error) throw new Error("Interakce nálezu se nepodařilo načíst.");

  const awaitingId = s.id_status !== "confirmed" && s.id_status !== "disputed";
  const statusColor = awaitingId ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--accent)] text-[var(--accent-foreground)]";
  const visibility = s.geoprivacy === "open" ? "Přesná poloha" : s.geoprivacy === "private" ? "Soukromá poloha" : "Přibližná poloha";

  return <section className="flex-1 bg-[var(--background)] px-4 py-7 text-[var(--foreground)] sm:px-6 lg:px-8 lg:py-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={mapHref} className="inline-flex items-center gap-2 font-semibold text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]">← Zpět na mapu</Link>
        <Link href="/help-verify" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold transition hover:bg-[var(--surface-hover)]">Pomoz určit</Link>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-10">
        <article className="min-w-0">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="relative bg-[var(--surface-muted)]">
              <SightingGallery key={photoPaths.join("|")} id={id} paths={photoPaths} editable={!!gallery && user?.id === s.user_id} />
              <span className={`absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-md ${statusColor}`}><i className="size-2 rounded-full bg-current" />{statusLabel(s.id_status)}</span>
            </div>

            <div className="p-5 sm:p-8">
              <div className="mb-5 flex items-center gap-3"><UserAvatar profile={author} size={44} className="size-11 shrink-0 rounded-full border-2 border-[var(--surface)] shadow-sm" /><div className="min-w-0"><p className="truncate text-sm font-bold">{author?.display_name || s.poster_username || "Anonymní pozorovatel"}</p>{author?.username ? <Link href={`/profile/${author.username}`} className="text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)]">@{author.username}</Link> : <span className="text-xs text-[var(--foreground-muted)]">Autor nálezu</span>}</div><span className="ml-auto inline-flex max-w-48 items-center gap-1.5 text-right text-xs text-[var(--foreground-muted)]"><MapPin className="size-3.5 shrink-0 text-[var(--accent)]" /><SightingLocality id={s.id} restricted={s.geoprivacy === "private" || s.status === "hidden"} /></span></div>
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--foreground-muted)]">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(s.found_date)}</span>
                {s.is_backdated && <span>Zpětně přidaný nález</span>}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{sightingName(s)}</h1>
              {s.scientific_name && s.common_name && <p className="mt-1 text-lg italic text-[var(--foreground-muted)]">{s.scientific_name}</p>}

              <div className="mt-6 border-t border-[var(--border)] pt-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground-muted)]"><Tag className="size-4" />Poznámka k nálezu</div>
                {user?.id === s.user_id ? <NotesEditor id={id} initial={s.notes} /> : <p className="whitespace-pre-wrap leading-7 text-[var(--foreground-muted)]">{s.notes || "Autor k nálezu zatím nepřidal žádnou poznámku."}</p>}
              </div>

              <div className="mt-7 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><small className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Lokalita</small><span className="mt-1.5 flex gap-1.5 text-sm font-semibold"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />{locationLabel(s)}</span></div>
                <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><small className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Soukromí</small><span className="mt-1.5 block text-sm font-semibold">{visibility}</span></div>
                <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><small className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Počet</small><span className="mt-1.5 block text-sm font-semibold">{s.individual_count ? `${s.individual_count} ${s.individual_count === 1 ? "jedinec" : "jedinců"}` : "Neuvedeno"}</span></div>
              </div>

              {(s.status === "hidden" || s.reported_sensitive) && <p className="mt-5 flex gap-2 rounded-2xl bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] p-4 text-sm text-[var(--foreground-muted)]"><ShieldAlert className="size-5 shrink-0 text-[var(--warning)]" />{s.status === "hidden" ? "Nález skryl administrátor. Vidí ho pouze autor a administrátoři." : "Autor označil možný citlivý nebo chráněný druh."}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><LikeButton id={id} userId={user?.id ?? null} liked={!!likes.data} count={s.like_count ?? 0} /><div className="flex flex-wrap gap-3"><ReportSightingForm sightingId={id} />{user?.id === s.user_id && <DeleteSightingButton sightingId={id} />}</div></div>
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">Aktuální určení</p><h2 className="mt-1 text-xl font-bold">{awaitingId ? "Čeká na určení" : sightingName(s)}</h2></div><span className="grid size-9 place-items-center rounded-full bg-[var(--surface-muted)] text-lg font-bold text-[var(--moss)]">?</span></div>
            <p className="mb-5 text-sm leading-6 text-[var(--foreground-muted)]">{awaitingId ? "Pomoz komunitě určit tento nález. Nejprve odešli vlastní tip nebo ho přeskoč." : "Komunitní určení a návrhy pro tento nález."}</p>
            <IdentificationPanel key={`${user?.id}-${s.id_status}-${identifications.data?.map(row => row.id + row.species_id + row.species_name_text).join()}-${!!skips.data}`} sightingId={id} status={s.id_status} userId={user?.id ?? null} rows={identifications.data ?? []} skipped={!!skips.data} isAuthor={user?.id === s.user_id} embedded />
          </section>

          <section className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-5 sm:p-6">
            <div className="flex items-center gap-2"><Sparkles className="size-4 text-[var(--amber)]" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">Terénní vodítka</p></div>
            <h2 className="mt-2 text-xl font-bold">Co na snímku vidíme</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Tato část je připravená pro budoucí automatické i komunitní rozpoznání znaků.</p>
          </section>
        </aside>
      </div>
    </div>
  </section>;
}
