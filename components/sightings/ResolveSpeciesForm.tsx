"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, fieldClass, type Guess } from "@/lib/sightings";
import SpeciesPicker from "./SpeciesPicker";
export default function ResolveSpeciesForm({ id, name }: { id: string; name: string | null }) {
  const [guess, setGuess] = useState<Guess>({ speciesId: null, text: name ?? "" });
  const [create, setCreate] = useState(false); const [sensitive, setSensitive] = useState(false);
  const [scientific, setScientific] = useState(""); const [common, setCommon] = useState(""); const [family, setFamily] = useState("");
  const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition(); const router = useRouter();
  return <form className="space-y-4 rounded-2xl border p-5 dark:border-slate-700" onSubmit={event => { event.preventDefault(); setMessage(""); startTransition(async () => {
    try {
      const { error } = await createClient().rpc("resolve_sighting_species", { p_sighting_id: id, p_species_id: create ? undefined : guess.speciesId ?? undefined,
        p_scientific_name: create ? scientific : undefined, p_common_name: common, p_family: family, p_sensitive: sensitive });
      if (error) setMessage("Druh se nepodařilo přiřadit. Zkontroluj údaje a zda vědecký název již neexistuje v katalogu.");
      else { setMessage("Druh přiřazen. Citlivost polohy se automaticky zohlednila."); router.refresh(); }
    } catch { setMessage("Spojení se nezdařilo. Obnov stránku a ověř výsledek."); }
  }); }}><h2 className="text-xl font-bold">Přiřadit druh z katalogu / vyřešit spor</h2>
    {name && <p>Potvrzený text: <strong>{name}</strong></p>}
    <label className="flex gap-3"><input type="checkbox" checked={create} onChange={e => setCreate(e.target.checked)} />Založit nový druh a přiřadit</label>
    {create ? <><label className="block">Vědecký název *<input required className={fieldClass} value={scientific} onChange={e => setScientific(e.target.value)} /></label><label className="block">Český název<input className={fieldClass} value={common} onChange={e => setCommon(e.target.value)} /></label><label className="block">Čeleď<input className={fieldClass} value={family} onChange={e => setFamily(e.target.value)} /></label><label className="flex gap-3"><input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} />Citlivý / chráněný druh</label></> : <SpeciesPicker label="Existující druh" textAllowed={false} value={guess} onChange={setGuess} />}
    <button className={buttonClass} disabled={pending || (create ? !scientific.trim() : !guess.speciesId)}>{pending ? "Ukládám…" : "Potvrdit přiřazení"}</button><p role="status">{message}</p>
  </form>;
}
