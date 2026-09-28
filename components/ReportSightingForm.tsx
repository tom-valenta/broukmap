"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Flag, X } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthProvider";
import { reportSighting } from "@/app/sightings/actions";

const reasons = ["Nevhodný nebo nebezpečný obsah", "Nesprávné či zavádějící informace", "Problém s polohou nebo soukromím", "Spam nebo obtěžování", "Jiný důvod"];

export default function ReportSightingForm({ sightingId }: { sightingId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false); const [selected, setSelected] = useState(""); const [note, setNote] = useState(""); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  useEffect(() => { if (!open) return; const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", onEscape); return () => window.removeEventListener("keydown", onEscape); }, [open]);
  if (!user) return <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold transition hover:bg-[var(--surface-hover)]"><Flag className="size-4" />Nahlásit</Link>;
  const close = () => { if (!pending) setOpen(false); };
  return <>
    <button type="button" onClick={() => { setMessage(""); setOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold transition hover:bg-[var(--surface-hover)]"><Flag className="size-4" />Nahlásit</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><section role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)] shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><span className="grid size-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)]"><Flag className="size-5" /></span><h2 id="report-title" className="mt-4 text-2xl font-bold">Nahlásit nález</h2><p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">Vyber důvod. Doplňující zpráva pomůže administrátorům, ale není povinná.</p></div><button type="button" onClick={close} disabled={pending} aria-label="Zavřít formulář" className="grid size-10 place-items-center rounded-full transition hover:bg-[var(--surface-hover)]"><X className="size-5" /></button></div>
      <form className="mt-6 space-y-5" onSubmit={event => { event.preventDefault(); if (!selected) return; setMessage(""); const reason = note.trim() ? `${selected}\n\nDoplňující zpráva: ${note.trim()}` : selected; startTransition(async () => { try { const result = await reportSighting(sightingId, reason); if (result.error) { setMessage(result.error); return; } setSelected(""); setNote(""); setMessage("Hlášení bylo odesláno administrátorům."); } catch { setMessage("Odeslání se nezdařilo. Zkus to prosím znovu."); } }); }}>
        <fieldset><legend className="mb-3 text-sm font-bold">Důvod nahlášení</legend><div className="grid gap-2">{reasons.map(reason => <label key={reason} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm transition ${selected === reason ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)]"}`}><input type="radio" name="report-reason" value={reason} checked={selected === reason} onChange={() => setSelected(reason)} className="accent-[var(--accent)]" />{reason}</label>)}</div></fieldset>
        <label className="block space-y-2"><span className="text-sm font-bold">Doplňující zpráva <span className="font-normal text-[var(--foreground-muted)]">(nepovinné)</span></span><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={4} placeholder="Co by měl administrátor vědět?" className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]" /></label>
        {message && <p role="status" className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm">{message}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={close} disabled={pending} className="min-h-11 rounded-xl px-4 text-sm font-semibold hover:bg-[var(--surface-hover)]">Zrušit</button><button disabled={pending || !selected} className="min-h-11 rounded-xl bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{pending ? "Odesílám…" : "Odeslat hlášení"}</button></div>
      </form>
    </section></div>}
  </>;
}
