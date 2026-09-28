"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MapFilters as Filters } from "@/lib/map-filters";

const inputClass = "min-h-10 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm";
type SpeciesOption = { id: string; scientific_name: string; common_name: string | null };
export default function MapFilters({ value, onChange, today, message, loading }: {
  value: Filters; onChange: (value: Filters) => void; today: string; message: string; loading: boolean;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ query: string; options: SpeciesOption[]; error: boolean } | null>(null);
  const needle = search.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 80);
  useEffect(() => {
    if (needle.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const { data, error } = await createClient().from("species").select("id,scientific_name,common_name")
        .or(`scientific_name.ilike.%${needle}%,common_name.ilike.%${needle}%`).order("scientific_name").limit(12).abortSignal(controller.signal);
      if (!controller.signal.aborted) setResults({ query: needle, options: data ?? [], error: !!error });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [needle]);
  const current = needle.length >= 2 && results?.query === needle ? results : null;
  const patch = (update: Partial<Filters>) => onChange({ ...value, ...update });
  const periodLabel = value.period === "today" ? "Dnes" : value.period === "day" ? value.day.split("-").reverse().join(".") : value.period === "year" ? value.year : "Vše";
  return <aside aria-label="Hledání a filtry mapy" className="pointer-events-none absolute left-3 top-[calc(12px+env(safe-area-inset-top))] z-20 w-[min(28rem,calc(100vw-24px))] space-y-2 text-[var(--foreground)] sm:left-5" onKeyDown={event => { if (event.key === "Escape") { setExpanded(false); setSearch(""); } }}>
    <div className="pointer-events-auto flex h-14 items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2 shadow-lg">
      <Link href="/" aria-label="Zpět na úvodní stránku" className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"><ArrowLeft className="size-5" /></Link>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={`${id}-search`} className="sr-only">Hledat druh brouka</label>
        <input id={`${id}-search`} type="search" autoComplete="off" maxLength={80} placeholder="Hledat druh brouka…" value={search} onChange={event => setSearch(event.target.value)} className="h-11 w-full min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-[var(--foreground-muted)] focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-controls={`${id}-results`} />
      </div>
      <Search aria-hidden="true" className="mx-1 size-5 shrink-0 text-[var(--foreground-muted)]" />
      <div className="mx-1 h-6 w-px bg-[var(--border)]" />
      <button type="button" aria-label="Filtry" title="Filtry mapy" aria-expanded={expanded} aria-controls={`${id}-filters`} onClick={() => setExpanded(!expanded)} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold transition ${expanded ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--surface-hover)]"}`}><SlidersHorizontal className="size-4" /><span>{periodLabel}</span></button>
    </div>
    {needle.length >= 2 && <div id={`${id}-results`} className="pointer-events-auto max-h-64 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
      {!current ? <p role="status" className="p-3 text-xs">Hledám druhy…</p> : current.error ? <p role="status" className="p-3 text-xs">Katalog se nepodařilo načíst. Zkus hledání znovu.</p> : !current.options.length ? <p className="p-3 text-xs">V katalogu nic nenalezeno. Můžeš hledat podle textového určení níže.</p> : <ul>{current.options.map(option => <li key={option.id}><button type="button" disabled={value.species.some(item => item.id === option.id)} onClick={() => { patch({ species: [...value.species, { id: option.id, label: option.common_name || option.scientific_name }] }); setSearch(""); }} className="min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] disabled:opacity-40"><strong className="block">{option.common_name || option.scientific_name}</strong>{option.common_name && <em className="text-xs text-[var(--foreground-muted)]">{option.scientific_name}</em>}</button></li>)}</ul>}
      <button type="button" disabled={value.species.some(item => item.id === `text:${needle}`)} onClick={() => { patch({ species: [...value.species, { id: `text:${needle}`, label: needle }] }); setSearch(""); }} className="min-h-11 w-full border-t border-[var(--border)] px-3 py-2 text-left text-sm font-semibold text-[var(--accent)] disabled:opacity-40">Hledat v textovém určení: „{needle}“</button>
    </div>}
    {value.species.length > 0 && <ul className="pointer-events-auto flex flex-wrap gap-1.5">{value.species.map(species => <li key={species.id}><button type="button" aria-label={`Odebrat filtr ${species.label}`} onClick={() => patch({ species: value.species.filter(item => item.id !== species.id) })} className="flex min-h-9 items-center gap-2 rounded-full bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-foreground)]">{species.label}<X className="size-3" aria-hidden="true" /></button></li>)}</ul>}
    {expanded && <div id={`${id}-filters`} className="pointer-events-auto max-h-[calc(100dvh-180px)] space-y-3 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
      <label className="block space-y-1 text-xs font-medium"><span>Období</span><select value={value.period} onChange={event => patch({ period: event.target.value as Filters["period"] })} className={inputClass}><option value="today">Dnes (automaticky každý den)</option><option value="day">Konkrétní den</option><option value="year">Celý rok</option><option value="all">Všechna data</option></select></label>
      {value.period === "day" && <label className="block space-y-1 text-xs font-medium"><span>Datum</span><input type="date" min="1900-01-01" max={today} value={value.day} onChange={event => patch({ day: event.target.value })} className={inputClass} /></label>}
      {value.period === "year" && <label className="block space-y-1 text-xs font-medium"><span>Rok</span><input type="number" min="1900" max={Number(today.slice(0, 4))} step="1" value={value.year} onChange={event => patch({ year: event.target.value })} className={inputClass} /></label>}
      <label className="block space-y-1 text-xs font-medium"><span>Datum podle</span><select value={value.dateField} onChange={event => patch({ dateField: event.target.value as Filters["dateField"] })} className={inputClass}><option value="created_at">Přidání příspěvku</option><option value="found_date">Pozorování nálezu</option></select></label>
      <label className="block space-y-1 text-xs font-medium"><span>Určení druhu</span><select value={value.status} onChange={event => patch({ status: event.target.value as Filters["status"] })} className={inputClass}><option value="all">Všechna určení</option><option value="confirmed">Potvrzené</option><option value="needs_id">Čeká na určení</option><option value="disputed">Sporné</option></select></label>
      <button type="button" onClick={() => { setSearch(""); onChange({ period: "today", day: today, year: today.slice(0, 4), dateField: "created_at", status: "all", species: [] }); }} className="min-h-10 text-sm font-semibold text-[var(--accent)]">Obnovit dnešní nálezy</button>
    </div>}
    <p role="status" aria-live="polite" className="mx-1 w-fit max-w-full rounded-lg bg-[var(--surface)]/95 px-2.5 py-1.5 text-xs text-[var(--foreground-muted)] shadow-sm">{loading ? "Načítám nálezy…" : message}</p>
  </aside>;
}
