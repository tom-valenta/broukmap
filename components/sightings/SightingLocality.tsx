"use client";
import { useEffect, useState } from "react";

// Load on demand with one request at a time; don't fan out a whole profile at once.
let queue: Promise<unknown> = Promise.resolve();
export default function SightingLocality({ id, restricted }: { id: string | null; restricted: boolean }) {
  const [result, setResult] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (!id || restricted) return;
    let cancelled = false;
    queue = queue.catch(() => {}).then(async () => {
      if (cancelled) return;
      let text = "Lokalita není dostupná";
      try {
        const response = await fetch(`/api/sightings/${id}/locality`, { cache: "no-store" });
        if (response.ok) text = (await response.json()).locality || "Obec neurčena";
      } catch { /* Keep the card usable when geocoding is unavailable. */ }
      if (!cancelled) setResult({ id, text });
    });
    return () => { cancelled = true; };
  }, [id, restricted]);
  return <span>{restricted ? "Neveřejná lokalita" : result?.id === id ? result?.text : "Zjišťuji obec…"}</span>;
}
