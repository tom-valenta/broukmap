/* eslint-disable @next/next/no-img-element -- Local photo previews. */
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, fieldClass, localToday, prepareSightingPhoto, type Guess } from "@/lib/sightings";
import { MAX_SIGHTING_PHOTOS, movePhoto, reorderPhoto } from "@/lib/photo-order";
import usePhotoDrag from "./usePhotoDrag";
import PhotoOrderBadge from "./PhotoOrderBadge";
import PhotoOrderButtons from "./PhotoOrderButtons";
import SpeciesPicker from "./SpeciesPicker";
export default function AddSightingForm({ location, onClose }: { location: [number, number]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const router = useRouter();
  const [date, setDate] = useState(localToday);
  const [guess, setGuess] = useState<Guess>({ speciesId: null, text: "" });
  const [notes, setNotes] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [privacy, setPrivacy] = useState("obscured");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<{ id: string; blob: Blob; preview: string }[]>([]);
  const previews = useRef(new Set<string>());
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const photoDrag = usePhotoDrag(busy || locked || preparing, (from, to) => {
    setPhotos(current => reorderPhoto(current, from, to));
  });
  const uploadState = useRef<{ id: string; paths: Map<string, string> } | null>(null);
  useEffect(() => {
    const urls = previews.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  async function addPhotos(files: File[]) {
    if (preparingRef.current || submitting.current || locked) return;
    if (photos.length + files.length > MAX_SIGHTING_PHOTOS) {
      setMessage(`Vyber nejvýše ${MAX_SIGHTING_PHOTOS} fotografií celkem.`); return;
    }
    preparingRef.current = true; setPreparing(true); setMessage("");
    try {
      for (const file of files) {
        const blob = await prepareSightingPhoto(file);
        const preview = URL.createObjectURL(blob); previews.current.add(preview);
        setPhotos(current => [...current, { id: crypto.randomUUID(), blob, preview }]);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Fotografii nelze zpracovat."); }
    finally { preparingRef.current = false; setPreparing(false); }
  }
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function submit() {
    if (submitting.current || preparingRef.current) return;
    submitting.current = true; setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pro přidání nálezu se přihlas.");
      if (!photos.length) throw new Error("Vyber alespoň jednu fotografii nálezu.");
      setLocked(true);
      const upload = uploadState.current ?? { id: crypto.randomUUID(), paths: new Map<string, string>() };
      uploadState.current = upload;
      for (const [index, photo] of photos.entries()) {
        if (upload.paths.has(photo.id)) continue;
        setMessage(`Nahrávám fotografii ${index + 1} z ${photos.length}…`);
        const path = `${user.id}/${upload.id}-${photo.id}.jpg`;
        const { error } = await supabase.storage.from("sighting-photos").upload(path, photo.blob, { contentType: "image/jpeg", cacheControl: "0" });
        if (error) {
          // An interrupted response can hide a successful upload. Check before retrying.
          const { data } = await supabase.storage.from("sighting-photos").download(path);
          if (!data) throw new Error("Fotografii se nepodařilo nahrát. Zkus to znovu.");
        }
        upload.paths.set(photo.id, path);
      }
      const { id } = upload;
      // Reuse the ID after uncertain responses: never post a duplicate sighting.
      const existing = await supabase.from("sightings").select("id").eq("id", id).maybeSingle();
      if (existing.error) throw new Error("Nepodařilo se ověřit stav uložení. Zkus to znovu.");
      if (!existing.data) {
        setMessage("Ukládám nález…");
        const { error } = await supabase.rpc("create_sighting_with_photos", {
          p_id: id, p_photos: photos.map(photo => upload.paths.get(photo.id)!), p_latitude: location[0], p_longitude: location[1], p_found_date: date,
          p_geoprivacy: privacy, p_sensitive: sensitive, p_notes: notes,
          p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          p_species_id: guess.speciesId ?? undefined, p_species_text: undefined,
        });
        if (error) throw new Error("Nález se nepodařilo uložit. Zkontroluj datum a formulář; při opakování nevznikne druhý nález.");
      }
      router.push(`/sightings/${id}`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nález se nepodařilo uložit."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={event => {
    // File inputs also emit cancel; only handle cancellation of the dialog itself.
    if (event.target !== event.currentTarget) return;
    if (busy || preparing) event.preventDefault(); else onClose();
  }} className="m-auto max-h-[90dvh] w-[min(94vw,38rem)] touch-pan-y overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl backdrop:bg-black/50" aria-labelledby="add-title">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id="add-title" className="text-2xl font-bold">Nový nález</h2><button type="button" aria-label="Zavřít formulář" disabled={busy || preparing} className="min-h-11 px-3" onClick={onClose}>✕</button></div>
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); void submit(); }}>
      <p className="text-sm text-[var(--foreground-muted)]">Vybraná poloha: {location[0].toFixed(5)}, {location[1].toFixed(5)}</p>
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <div className="space-y-3">
          <label className="block space-y-2"><span className="text-sm font-medium">Fotografie * ({photos.length}/{MAX_SIGHTING_PHOTOS})</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled={locked || preparing || photos.length >= MAX_SIGHTING_PHOTOS} onChange={e => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void addPhotos(files); }} className={fieldClass} /><span className="block text-xs text-[var(--foreground-muted)]">Nejvýše 6 fotek, každá do 30 MB. JPEG, PNG, WebP nebo HEIC. GPS metadata odstraníme. První fotka se zobrazí na mapě.</span></label>
          {preparing && <p role="status" className="text-sm">Připravuji fotografie…</p>}
          {photos.length > 1 && <p className="text-xs text-[var(--foreground-muted)]">Fotky přetáhni do požadovaného pořadí. Číslo 1 bude na mapě.</p>}
          <ol className="flex gap-2 overflow-x-auto py-2">
            {photos.map((photo, index) => <li key={photo.id} {...photoDrag.itemProps(index)} className={`w-28 shrink-0 space-y-2 border border-[var(--border)] p-2 ${photoDrag.itemClass(index)}`}>
              <div className="relative"><PhotoOrderBadge index={index} draggable={!busy && !locked && !preparing} /><img draggable={false} src={photo.preview} alt={`Vybraná fotografie ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" /></div>
              <PhotoOrderButtons index={index} count={photos.length} disabled={locked || preparing} onMove={direction => setPhotos(current => movePhoto(current, index, direction))} />
              <button data-no-drag type="button" disabled={locked || preparing} className="min-h-11 text-sm disabled:opacity-30" onClick={() => { URL.revokeObjectURL(photo.preview); previews.current.delete(photo.preview); setPhotos(current => current.filter(item => item.id !== photo.id)); }}>Odebrat</button>
            </li>)}
          </ol>
          {locked && <p className="text-xs text-[var(--foreground-muted)]">Nahrávání začalo. Pořadí můžeš upravit po uložení v detailu nálezu.</p>}
        </div>
        <label className="block space-y-2"><span className="text-sm font-medium">Datum nálezu *</span><input type="date" min="1900-01-01" max={localToday()} required value={date} onChange={e => setDate(e.target.value)} className={fieldClass} /></label>
        {date < localToday() && <p className="text-sm">Nález bude označen jako zpětně přidaný.</p>}
        <SpeciesPicker value={guess} onChange={setGuess} />
        <label className="block space-y-2"><span className="text-sm font-medium">Poznámky (nepovinné)</span><textarea maxLength={1000} rows={3} value={notes} onChange={e => setNotes(e.target.value)} className={fieldClass} /><span className="text-xs text-[var(--foreground-muted)]">Poznámky můžeš později upravit. Neuváděj v nich přesnou polohu citlivých druhů.</span></label>
        <label className="flex items-start gap-3 rounded-xl bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface-muted))] p-4 text-sm"><input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--warning)]" /><span>Myslím, že by mohlo jít o chráněný nebo citlivý druh.</span></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Soukromí polohy</span><select className={fieldClass} value={sensitive ? "obscured" : privacy} disabled={sensitive} onChange={e => setPrivacy(e.target.value)}><option value="open">Veřejná — přesná poloha</option><option value="obscured">Rozmazaná — přibližná poloha do 100 m</option><option value="private">Soukromá — jen já a administrátor</option></select></label>
        <p className="text-sm">U možného chráněného druhu se poloha rozmaže v řádu kilometrů, i když citlivost odhalí až pozdější určení.</p>
        {sensitive && <p className="text-sm">Nález dostane prioritu při kontrole administrátorem.</p>}
        {!sensitive && privacy === "private" && <p className="text-sm">Nález se započítá do tvých statistik, ale nebude na veřejné mapě ani ve frontě určování.</p>}
      </fieldset>
      <p role="status" aria-live="polite" className="text-sm">{message}</p>
      <button type="submit" disabled={busy || preparing || !photos.length} className={`${buttonClass} w-full`}>{busy ? "Ukládám…" : "Přidat nález"}</button>
    </form>
  </dialog>;
}
