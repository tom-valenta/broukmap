"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import MapFilters from "./MapFilters";
import { defaultMapFilters, mapDateRange, mapFiltersFromSearch, mapFiltersSearch, mapSpeciesExpression, type MapFilters as FilterState } from "@/lib/map-filters";
import { buttonClass, localToday } from "@/lib/sightings";
import { MAP_SIGHTING_FIELDS, type MapSighting } from "@/lib/map-sightings";
import type { Bounds } from "./LeafletMap";
import { locateMap, recentMapLocation, type LocationPoint } from "@/lib/map-location";
const AddSightingForm = dynamic(() => import("@/components/sightings/AddSightingForm"), { ssr: false });
const Map = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="grid h-full place-items-center" role="status">Načítám mapu…</div> });
export default function SightingMap() {
  const { user } = useAuth();
  const [today, setToday] = useState(localToday);
  const [filters, setFilters] = useState<FilterState>(() => typeof window === "undefined" ? defaultMapFilters(localToday()) : mapFiltersFromSearch(new URLSearchParams(window.location.search), localToday()));
  const mapHref = `/map${mapFiltersSearch(filters, today)}`;
  const filterKey = JSON.stringify([filters, filters.period === "today" ? today : ""]);
  const [loadedFilter, setLoadedFilter] = useState("");
  const [queryPending, setQueryPending] = useState(false);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [sightings, setSightings] = useState<MapSighting[]>([]);
  const [sightingViewer, setSightingViewer] = useState(user?.id ?? null);
  const [open, setOpen] = useState(false);
  const [locateRequest, setLocateRequest] = useState(0);
  const [locating, setLocating] = useState(false);
  const [dataMessage, setDataMessage] = useState("");
  const [, startTransition] = useTransition();
  const [locationMessage, setLocationMessage] = useState("");
  const [initialLocation, setInitialLocation] = useState<LocationPoint | null>(recentMapLocation);
  const onBounds = useCallback((value: Bounds) => setBounds(current => current && current.south === value.south && current.north === value.north && current.west === value.west && current.east === value.east ? current : value), []);
  const onPick = useCallback((point: [number, number]) => setPin(current => current ? null : point), []);
  useEffect(() => {
    let disposed = false;
    locateMap().then(position => { if (!disposed) setInitialLocation(position); }).catch(() => {});
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    if (`${window.location.pathname}${window.location.search}` !== mapHref) window.history.replaceState(null, "", mapHref);
  }, [mapHref]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setToday(localToday());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      clearTimeout(timer);
      timer = setTimeout(tick, midnight.getTime() - now.getTime() + 50);
    };
    timer = setTimeout(tick, 0);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", tick); window.removeEventListener("focus", tick); };
  }, []);
  async function locate() {
    if (locating) return;
    setLocating(true); setLocationMessage("Zjišťuji polohu…");
    try {
      const position = await locateMap(true);
      setInitialLocation(position); setLocateRequest(value => value + 1); setLocationMessage("");
    } catch (error) { setLocationMessage(error instanceof Error ? error.message : "Polohu se nepodařilo zjistit."); }
    finally { setLocating(false); }
  }
  useEffect(() => {
    if (!bounds) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let range;
      try { range = mapDateRange(filters, today); }
      catch (error) { setDataMessage(error instanceof Error ? error.message : "Neplatné datum."); setLoadedFilter(filterKey); setSightings([]); setQueryPending(false); return; }
      setQueryPending(true);
      let query = createClient().from("public_sightings").select(MAP_SIGHTING_FIELDS).in("status", ["pending", "approved"]).neq("geoprivacy", "private")
        .gte("latitude", bounds.south).lte("latitude", bounds.north);
      query = bounds.west <= bounds.east ? query.gte("longitude", bounds.west).lte("longitude", bounds.east) : query.or(`longitude.gte.${bounds.west},longitude.lte.${bounds.east}`);
      if (range) query = query.gte(filters.dateField, range.from).lt(filters.dateField, range.until);
      const speciesExpression = mapSpeciesExpression(filters.species);
      if (speciesExpression) query = query.or(speciesExpression);
      if (filters.status !== "all") query = query.eq("id_status", filters.status);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(1000).abortSignal(controller.signal);
      if (!controller.signal.aborted) {
        setQueryPending(false);
        if (error) { setLoadedFilter(filterKey); setSightings([]); setDataMessage("Nálezy se nepodařilo načíst. Posuň mapu pro nový pokus."); return; }
        setDataMessage(data?.length === 1000 ? "Zobrazeno nejnovějších 1 000 nálezů. Přibliž mapu pro další." : data?.length ? `${data.length} nálezů v zobrazené oblasti.` : "Pro tyto filtry v zobrazené oblasti nejsou žádné nálezy.");
        startTransition(() => { setSightings(data ?? []); setLoadedFilter(filterKey); setSightingViewer(user?.id ?? null); });
      }
    }, 100);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [bounds, user?.id, filters, today, filterKey]);
  return <section aria-label="Mapa nálezů" className="fixed inset-x-0 top-0 isolate h-dvh overflow-hidden bg-stone-50 text-stone-900 dark:bg-slate-950 dark:text-slate-100">
    <Map sightings={sightingViewer === (user?.id ?? null) && loadedFilter === filterKey ? sightings : []} pin={pin} onPick={onPick} onMovePin={setPin} onBounds={onBounds} locateRequest={locateRequest} initialLocation={initialLocation} mapHref={mapHref} />
    <div className="absolute right-3 bottom-[calc(28px+env(safe-area-inset-bottom))] z-10 flex max-w-[calc(100%-24px)] items-center gap-3 sm:right-5">
      {locationMessage && <p role="status" className="rounded-xl bg-white/95 px-3 py-2 text-sm shadow-lg dark:bg-slate-900/95">{locationMessage}</p>}
      <button type="button" aria-label="Zpět na moji aktuální polohu" title="Moje poloha"
        disabled={locating}
        onClick={() => void locate()}
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-lg disabled:opacity-60 dark:bg-slate-900 dark:text-blue-400">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>
      </button>
    </div>
    <header className="pointer-events-none absolute right-3 top-[calc(84px+env(safe-area-inset-top))] z-10 sm:right-5 sm:top-[calc(12px+env(safe-area-inset-top))]">
      <h1 className="sr-only">Mapa nálezů</h1>
      <Link href="/help-verify" className={`${buttonClass} pointer-events-auto inline-flex items-center text-sm shadow-lg`}>Pomoz určit druh</Link>
    </header>
    <MapFilters value={filters} onChange={setFilters} today={today} loading={queryPending || loadedFilter !== filterKey} message={dataMessage} />
    {pin && <div className="pointer-events-none absolute inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-10 mx-auto max-w-xl sm:inset-x-5"><div className="pointer-events-auto space-y-3 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-emerald-900 dark:bg-slate-900/95">
        <div><strong className="text-sm sm:text-base">Upřesni polohu přetažením špendlíku</strong><p className="text-xs text-stone-600 dark:text-slate-400">Další klepnutí do mapy špendlík zruší.</p><p className="mt-1 text-sm tabular-nums text-stone-500 dark:text-slate-400">{pin[0].toFixed(5)}, {pin[1].toFixed(5)}</p></div>
        <div className="flex items-center gap-3"><button className="min-h-11 rounded-lg px-3 text-sm" onClick={() => setPin(null)}>Zrušit</button>{user ? <button className={`${buttonClass} flex-1`} onClick={() => setOpen(true)}>Potvrdit místo</button> : <Link className={`${buttonClass} flex-1 text-center`} href="/login">Přihlásit a přidat</Link>}</div>
    </div></div>}
    {open && pin && <AddSightingForm location={pin} onClose={() => setOpen(false)} />}
  </section>;
}
