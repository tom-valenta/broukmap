/* eslint-disable @next/next/no-img-element -- Access-controlled photo endpoint. */
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { signedSightingPhotoUrl, useSightingPhotoUrl } from "./SightingPhoto";

export default function PhotoViewer({ id, paths, selected, onSelect }: {
  id: string; paths: string[]; selected: string; onSelect: (path: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const index = Math.max(0, paths.indexOf(selected));
  // A detail needs more pixels than a map card; the dialog gets a near-native
  // rendition so 4K uploads stay sharp on desktop displays.
  const src = useSightingPhotoUrl(selected, expanded ? 2048 : 1280, 90);
  const [loaded, setLoaded] = useState("");
  const [decoded, setDecoded] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState("");
  const step = (direction: number) => onSelect(paths[(index + direction + paths.length) % paths.length]);
  useEffect(() => { setZoomed(false); }, [selected]);
  useEffect(() => {
    if (!src) return;
    if (paths.length < 2 || loaded !== src) return;
    // Do not compete with the LCP image by downloading the whole gallery.
    // One small adjacent preview keeps the next navigation responsive.
    let cancelled = false;
    const queue = [paths[(index + 1) % paths.length]];
    async function warm() {
      while (!cancelled && queue.length) {
        const path = queue.shift()!;
        const url = await signedSightingPhotoUrl(path, 320);
        if (!url) continue;
        const image = new Image(); image.fetchPriority = "low"; image.src = url;
        try {
          await image.decode();
          if (!cancelled) setDecoded(current => new Set(current).add(url));
        } catch { /* Foreground navigation shows errors and retries normally. */ }
      }
    }
    void warm();
    return () => { cancelled = true; };
  }, [id, index, paths, loaded, src]);
  useEffect(() => {
    if (!expanded) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);
  function close() { dialog.current?.close(); setExpanded(false); setZoomed(false); opener.current?.focus(); }
  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || paths.length < 2) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); event.stopPropagation(); step(event.key === "ArrowLeft" ? -1 : 1);
    }
  }
  const controls = <>
    {paths.length > 1 && <>
      <button type="button" aria-label="Předchozí fotografie" onClick={() => step(-1)} className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white shadow-lg hover:bg-black/80"><ChevronLeft /></button>
      <button type="button" aria-label="Další fotografie" onClick={() => step(1)} className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white shadow-lg hover:bg-black/80"><ChevronRight /></button>
    </>}
    <span aria-live="polite" className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold tabular-nums text-white">{index + 1} / {paths.length}</span>
  </>;
  function picture(fullscreen: boolean) {
    const image = src && <img src={src} alt={`Fotografie nálezu ${index + 1} z ${paths.length}`} decoding="async" fetchPriority="high" onLoad={() => { setLoaded(src); setDecoded(current => new Set(current).add(src)); }} onError={() => setFailed(src)} className={`relative h-full w-full object-contain transition-transform duration-200 ${fullscreen && zoomed ? "scale-[2]" : "scale-100"} ${loaded === src || decoded.has(src) ? "opacity-100" : "opacity-0"}`} />;
    return <>
      <div className={`relative ${fullscreen ? "h-full w-full overflow-hidden" : "h-[min(60vh,38rem)] min-h-64 w-full"}`}>
        {fullscreen ? <button type="button" onClick={() => setZoomed(current => !current)} aria-label={zoomed ? "Oddálit fotografii" : "Přiblížit fotografii"} className={`block h-full w-full ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}>{image}</button> : image}
      </div>
      {(!src || (loaded !== src && !decoded.has(src) && failed !== src)) && <span role="status" className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded-lg bg-black/65 px-3 py-1 text-sm text-white">Načítám…</span>}
      {failed === src && <span role="alert" className="absolute inset-x-14 top-1/2 rounded-lg bg-black/75 p-3 text-center text-sm text-white">Fotografii se nepodařilo načíst. Zkus jiný snímek nebo obnov stránku.</span>}
    </>;
  }
  return <>
    <div onKeyDown={keyboard} role="region" aria-label="Galerie nálezu, listování šipkami" className="relative bg-[var(--surface-muted)]">
      <button ref={opener} type="button" onClick={() => setExpanded(true)} aria-label="Otevřít galerii přes celou obrazovku" className="relative block w-full cursor-zoom-in">{picture(false)}<Maximize2 aria-hidden="true" className="absolute bottom-3 right-3 size-8 rounded-lg bg-black/60 p-1.5 text-white" /></button>
      {controls}
    </div>
    {expanded && <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setExpanded(false); opener.current?.focus(); }} onKeyDown={keyboard} onClick={event => { if (event.target === event.currentTarget) close(); }} aria-label="Fotogalerie nálezu" className="fixed inset-0 m-auto h-dvh max-h-none w-screen max-w-none isolate overflow-hidden bg-slate-800 p-3 text-white backdrop:bg-slate-900/70 backdrop:backdrop-blur-md sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {src && <img src={src} alt="" decoding="async" className="h-full w-full scale-125 object-cover opacity-50 blur-3xl saturate-75" />}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/25 to-slate-950/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(15,23,42,0.45)_100%)]" />
      </div>
      <button autoFocus type="button" onClick={close} aria-label="Zavřít galerii" className="absolute right-4 top-3 z-30 grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/25"><X /></button>
      <div className="relative flex h-full min-h-0 flex-col gap-3 pt-10"><div className="relative mx-auto min-h-0 w-full max-w-7xl flex-1">{picture(true)}{controls}</div>
      <p className="shrink-0 text-center text-xs text-white/60">← → další fotografie · Esc zavřít</p></div>
    </dialog>}
  </>;
}
