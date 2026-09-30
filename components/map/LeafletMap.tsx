"use client";
/* eslint-disable @next/next/no-img-element -- Private photos bypass shared image caching. */
import { memo, useCallback, useEffect, useRef } from "react";
import type { MapSighting } from "@/lib/map-sightings";
import type { LocationPoint } from "@/lib/map-location";
import Link from "next/link";
import { divIcon, latLng, type Marker as LeafletMarker } from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { locationLabel, sightingName, statusLabel } from "@/lib/sightings";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "./map.css";
import { preloadSightingPhoto, SightingPhoto } from "@/components/sightings/SightingPhoto";
export type Bounds = { south: number; north: number; west: number; east: number };
const icon = (color: string, symbol: string) => divIcon({ className: "bugmap-marker", html: `<span style="background:${color}"><b>${symbol}</b></span>`, iconSize: [36, 44], iconAnchor: [18, 40], popupAnchor: [0, -40] });
const neutral = icon("#64748b", "?"); const confirmed = icon("#047857", "✓"); const draft = icon("#c2410c", "+");
const wrap = (longitude: number) => ((longitude + 180) % 360 + 360) % 360 - 180;
type LocationControls = { locateRequest: number; initialLocation: LocationPoint | null };
function Events({ onPick, onBounds, locateRequest, initialLocation }: LocationControls & { onPick: (point: [number, number]) => void; onBounds: (bounds: Bounds) => void }) {
  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interacted = useRef(false);
  const cancelPendingClick = useCallback(() => {
    if (pendingClick.current !== null) clearTimeout(pendingClick.current);
    pendingClick.current = null;
  }, []);
  useEffect(() => cancelPendingClick, [cancelPendingClick]);
  const map = useMapEvents({
    click: e => {
      cancelPendingClick();
      if (e.originalEvent.detail > 1) return;
      const point: [number, number] = [Math.max(-90, Math.min(90, e.latlng.lat)), wrap(e.latlng.lng)];
      // Wait for a possible second click so a new marker cannot intercept it.
      pendingClick.current = setTimeout(() => {
        pendingClick.current = null;
        onPick(point);
      }, 250);
    },
    dblclick: cancelPendingClick,
    zoomstart: cancelPendingClick,
    dragstart: cancelPendingClick,
    moveend: () => { const b = map.getBounds(); const full = b.getEast() - b.getWest() >= 360; onBounds({ south: Math.max(-90, b.getSouth()), north: Math.min(90, b.getNorth()), west: full ? -180 : wrap(b.getWest()), east: full ? 180 : wrap(b.getEast()) }); },
  });
  useEffect(() => {
    const publish = () => {
      const b = map.getBounds(); const full = b.getEast() - b.getWest() >= 360;
      onBounds({ south: Math.max(-90, b.getSouth()), north: Math.min(90, b.getNorth()), west: full ? -180 : wrap(b.getWest()), east: full ? 180 : wrap(b.getEast()) });
    };
    publish();
    const observer = new ResizeObserver(() => map.invalidateSize({ debounceMoveend: true }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, onBounds]);
  useEffect(() => {
    const cancel = () => { interacted.current = true; };
    const container = map.getContainer();
    container.addEventListener("pointerdown", cancel);
    container.addEventListener("wheel", cancel, { passive: true });
    container.addEventListener("keydown", cancel);
    return () => {
      container.removeEventListener("pointerdown", cancel);
      container.removeEventListener("wheel", cancel);
      container.removeEventListener("keydown", cancel);
    };
  }, [map]);
  const previousRequest = useRef(locateRequest);
  useEffect(() => {
    if (!initialLocation) return;
    const explicitlyRequested = previousRequest.current !== locateRequest;
    previousRequest.current = locateRequest;
    if (explicitlyRequested) interacted.current = false;
    if (!interacted.current) map.fitBounds(latLng(initialLocation.point[0], initialLocation.point[1]).toBounds(Math.max(initialLocation.accuracy * 2, 125)), { maxZoom: 17, animate: false });
  }, [initialLocation, locateRequest, map]);
  const displayedLocation = initialLocation;
  return displayedLocation && <>
    {/* A small visual halo, not an indication of GPS accuracy. */}
    <CircleMarker center={displayedLocation.point} radius={16} interactive={false}
      pathOptions={{ stroke: false, fillColor: "#3b82f6", fillOpacity: 0.16 }} />
    <CircleMarker center={displayedLocation.point} radius={8} interactive={false}
      pathOptions={{ color: "white", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} />
  </>;
}
export default function LeafletMap({ sightings, pin, onPick, onMovePin, onBounds, locateRequest, initialLocation, mapHref }: LocationControls & { sightings: MapSighting[]; pin: [number, number] | null; onPick: (p: [number, number]) => void; onMovePin: (p: [number, number]) => void; onBounds: (b: Bounds) => void; mapHref: string }) {
  return <MapContainer center={initialLocation?.point ?? [49.8, 15.5]} zoom={initialLocation ? 13 : 7} minZoom={2} maxZoom={19} doubleClickZoom worldCopyJump className="bugmap-map" attributionControl zoomControl={false}>
    <ZoomControl position="bottomright" />
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} updateWhenIdle keepBuffer={2} />
    <Events onPick={onPick} onBounds={onBounds} locateRequest={locateRequest} initialLocation={initialLocation} />
    <NearbyPhotoPreloader sightings={sightings} />
    <SightingMarkers sightings={sightings} mapHref={mapHref} />
    {pin && <Marker position={pin} icon={draft} draggable autoPan title="Poloha nového nálezu — přetažením upřesni" eventHandlers={{ dragend: event => { const p = (event.target as LeafletMarker).getLatLng(); onMovePin([Math.max(-90, Math.min(90, p.lat)), wrap(p.lng)]); } }} />}
  </MapContainer>;
}

const PRELOAD_LIMIT = 8;

function NearbyPhotoPreloader({ sightings }: { sightings: MapSighting[] }) {
  const map = useMap();
  useEffect(() => {
    const warmNearbyPhotos = () => {
      const center = map.getCenter();
      sightings.filter(s => s.photo_url && s.latitude != null && s.longitude != null)
        .sort((a, b) => {
          const distance = (s: MapSighting) => Math.pow(s.latitude! - center.lat, 2) + Math.pow((s.longitude! - center.lng) * Math.cos(center.lat * Math.PI / 180), 2);
          return distance(a) - distance(b);
        })
        .slice(0, PRELOAD_LIMIT)
        .forEach(s => { void preloadSightingPhoto(s.photo_url, 320); });
    };
    warmNearbyPhotos();
    map.on("moveend", warmNearbyPhotos);
    return () => { map.off("moveend", warmNearbyPhotos); };
  }, [map, sightings]);
  return null;
}



const SightingMarkers = memo(function SightingMarkers({ sightings, mapHref }: { sightings: MapSighting[]; mapHref: string }) {
  const prefetchPhoto = useCallback((path: string | null) => {
    if (path) void preloadSightingPhoto(path, 320);
  }, []);

  return (
    <MarkerClusterGroup chunkedLoading chunkInterval={16} chunkDelay={16} animate={false} showCoverageOnHover={false} removeOutsideVisibleBounds>
      {sightings.filter(s => s.id && s.latitude != null && s.longitude != null && s.geoprivacy !== "private").map(s => <Marker key={s.id} position={[s.latitude!, s.longitude!]} opacity={s.geoprivacy === "open" ? 1 : 0.6} icon={s.id_status === "confirmed" ? confirmed : neutral}
        eventHandlers={{ mouseover: () => prefetchPhoto(s.photo_url), mousedown: () => prefetchPhoto(s.photo_url) }}>
        <Popup><div className="w-52 space-y-2">{s.photo_url && <SightingPhoto path={s.photo_url} width={320} alt="Fotografie nálezu" loading="eager" decoding="async" className="h-28 w-full rounded-lg object-cover" />}<strong>{sightingName(s)}</strong><p>{statusLabel(s.id_status)}</p><p>{locationLabel(s)}</p>{s.location_precision === "exact" && s.geoprivacy !== "open" && <p>Skutečná poloha, viditelná jen tobě (autor/admin).</p>}<Link href={`/sightings/${s.id}?from=${encodeURIComponent(mapHref)}`}>Detail a určení →</Link></div></Popup>
      </Marker>)}
    </MarkerClusterGroup>
  );
});
