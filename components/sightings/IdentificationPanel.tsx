"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SpeciesPicker from "./SpeciesPicker";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, type Guess } from "@/lib/sightings";
export type Identification = { id: string; user_id: string; species_id: string | null; species_name_text: string | null; species: { common_name: string | null; scientific_name: string } | null };
export default function IdentificationPanel({ sightingId, status, userId, rows, skipped, isAuthor = false, embedded = false }: { sightingId: string; status: string | null; userId: string | null; rows: Identification[]; skipped: boolean; isAuthor?: boolean; embedded?: boolean }) {
  const own = rows.find(row => row.user_id === userId); const [guess, setGuess] = useState<Guess>({ speciesId: null, text: "" }); const [pending, startTransition] = useTransition(); const [error, setError] = useState(""); const router = useRouter();
  const open = status === "needs_id"; const committed = !!own || skipped; const unlocked = isAuthor || committed || !open;
  const groups = new Map<string, { label: string; count: number }>();
  for (const row of rows) { const key = row.species_id ? `id:${row.species_id}` : `text:${row.species_name_text?.trim().toLowerCase()}`; const group = groups.get(key); if (group) group.count++; else groups.set(key, { label: row.species?.common_name || row.species?.scientific_name || row.species_name_text || "Neznámý druh", count: 1 }); }
  function commitSkip() { if (!userId) return; setError(""); startTransition(async () => { try { const result = await createClient().from("user_skips").insert({ sighting_id: sightingId, user_id: userId }); if (result.error) throw result.error; router.refresh(); } catch { setError("Přeskočení se nepodařilo uložit. Obnov detail a zkus to znovu."); } }); }
  function commitGuess() { if (!userId || !guess.speciesId) return; setError(""); startTransition(async () => { try { const result = await createClient().from("identifications").insert({ sighting_id: sightingId, user_id: userId, species_id: guess.speciesId, species_name_text: null }); if (result.error) throw result.error; router.refresh(); } catch { setError("Tip se nepodařilo uložit. Obnov detail a zkus to znovu."); } }); }
  return <section className={embedded ? "space-y-5" : "space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"}>
    {!embedded && <h2 className="text-xl font-bold">Určení druhu</h2>}
    {!unlocked && <p className="text-sm text-[var(--foreground-muted)]">Nejdřív odešli vlastní nezávislý tip, nebo určení jednou provždy přeskoč. Potom uvidíš odpovědi ostatních.</p>}
    {unlocked && <div className="space-y-3">{rows.length ? <><p className="text-sm">Celkem {rows.length} komunitních tipů</p><ul className="space-y-2">{Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count).map(([key, group]) => <li key={key} className="rounded-xl bg-[var(--surface-muted)] p-3"><strong>{group.label}</strong><p className="text-sm text-[var(--foreground-muted)]">{group.count} hlasů · {Math.round(group.count / rows.length * 100)} %</p></li>)}</ul></> : <p className="text-sm text-[var(--foreground-muted)]">Zatím tu není žádný komunitní tip.</p>}</div>}
    {!open && <p className="text-sm">{status === "confirmed" ? "Určení je potvrzené. Hlasování je uzavřené." : "Návrhy jsou sporné. Rozhodne administrátor."}</p>}
    {open && userId && !isAuthor && !committed && <form className="space-y-4" onSubmit={event => { event.preventDefault(); commitGuess(); }}><SpeciesPicker value={guess} onChange={setGuess} label="Tvůj nezávislý tip" /><div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={pending || !guess.speciesId}>Odeslat finální tip</button><button type="button" disabled={pending} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm" onClick={commitSkip}>Nevím / přeskočit</button></div><p className="text-xs text-[var(--foreground-muted)]">Po odeslání už nelze tip změnit, smazat ani doplnit po přeskočení.</p></form>}
    {open && !userId && <Link href="/login" className="inline-block text-[var(--accent)] underline">Pro určení nebo přeskočení se přihlas.</Link>}
    {isAuthor && open && <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm text-[var(--foreground-muted)]">Jako autor nálezu můžeš sledovat komunitní tipy, ale tvůj původní pracovní tip se do hlasování nezapočítává.</p>}
    {own && open && <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm text-[var(--foreground-muted)]">Tvůj finální tip: <strong className="text-[var(--foreground)]">{own.species?.common_name || own.species?.scientific_name || own.species_name_text}</strong>. Odpověď už nelze změnit ani smazat.</p>}
    {skipped && open && <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm text-[var(--foreground-muted)]">Určení jsi přeskočil/a. Tato volba je finální a nález se ti už ve frontě určování neukáže.</p>}
    {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
    <p className="text-xs text-[var(--foreground-muted)]">Potvrzení vyžaduje alespoň 3 tipy a shodu nejméně 66 %. Bez shody při 8 tipech přebírá určení administrátor.</p>
  </section>;
}
