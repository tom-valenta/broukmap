/* eslint-disable @next/next/no-img-element -- Photos require per-request access checks. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { movePhoto, reorderPhoto } from "@/lib/photo-order";
import usePhotoDrag from "./usePhotoDrag";
import PhotoOrderBadge from "./PhotoOrderBadge";
import PhotoViewer, { galleryPhotoUrl } from "./PhotoViewer";
import PhotoOrderButtons from "./PhotoOrderButtons";

export default function SightingGallery({ id, paths, editable }: { id: string; paths: string[]; editable: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(paths);
  const [selected, setSelected] = useState(paths[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const photoDrag = usePhotoDrag(!editable || busy, (from, to) => {
    setOrder(current => reorderPhoto(current, from, to)); setMessage("");
  });
  const changed = order.some((path, index) => path !== paths[index]);

  async function save() {
    setBusy(true); setMessage("");
    try {
      const { data, error } = await createClient().from("sighting_photo_sets").update({ paths: order }).eq("sighting_id", id).select("sighting_id").maybeSingle();
      if (error || !data) throw new Error("Pořadí se nepodařilo uložit. Zkus to znovu.");
      setMessage("Pořadí uloženo. První fotka je na mapě."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pořadí se nepodařilo uložit."); }
    finally { setBusy(false); }
  }
  if (!selected) return <div className="p-12 text-center">Fotografie není k dispozici</div>;
  return <div>
    <PhotoViewer id={id} paths={order} selected={selected} onSelect={setSelected} />
    {order.length > 1 && <div className="space-y-3 p-4">
      <p className="text-sm text-[var(--foreground-muted)]">{order.length} fotografií · Lajk patří celému nálezu.{editable && " První fotka se zobrazuje na mapě."}</p>
      {editable && <p className="text-xs text-[var(--foreground-muted)]">Přetáhni fotku na nové místo. Pak ulož pořadí.</p>}
      <ol className="flex gap-2 overflow-x-auto py-2">
        {order.map((path, index) => <li key={path} {...photoDrag.itemProps(index)} className={`w-28 shrink-0 space-y-2 ${photoDrag.itemClass(index)}`}>
          <button type="button" onClick={() => setSelected(path)} aria-pressed={selected === path} aria-label={`Zobrazit fotografii ${index + 1}`} className={`relative block w-full overflow-hidden rounded-xl border-2 ${selected === path ? "border-[var(--accent)]" : "border-transparent"}`}><PhotoOrderBadge index={index} draggable={editable && !busy} /><img draggable={false} src={galleryPhotoUrl(id, path, 320)} alt={`Náhled ${index + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" /></button>
          {editable && <PhotoOrderButtons index={index} count={order.length} disabled={busy} onMove={direction => { setOrder(current => movePhoto(current, index, direction)); setMessage(""); }} />}
        </li>)}
      </ol>
      {editable && changed && <button type="button" disabled={busy} onClick={() => void save()} className="min-h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50">{busy ? "Ukládám…" : "Uložit pořadí"}</button>}
      <p role="status" className="text-sm">{message}</p>
    </div>}
  </div>;
}
