"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, fieldClass } from "@/lib/sightings";
export default function NotesEditor({ id, initial }: { id: string; initial: string | null }) {
  const [notes, setNotes] = useState(initial ?? ""); const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition(); const router = useRouter();
  return <form className="space-y-3" onSubmit={event => { event.preventDefault(); startTransition(async () => {
    try {
      const { data, error } = await createClient().from("sightings").update({ notes: notes.trim() || null }).eq("id", id).select("id");
      setMessage(error || !data?.length ? "Poznámky se nepodařilo uložit." : "Poznámky uloženy."); router.refresh();
    } catch { setMessage("Poznámky se nepodařilo uložit."); }
  }); }}><label className="block space-y-2"><span className="font-medium">Tvoje poznámky</span><textarea className={fieldClass} value={notes} maxLength={1000} rows={3} onChange={e => setNotes(e.target.value)} /></label><button className={buttonClass} disabled={pending}>Uložit poznámky</button><p role="status" className="text-sm">{message}</p></form>;
}
