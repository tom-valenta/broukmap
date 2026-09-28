export type LocationPoint = { point: [number, number]; accuracy: number };
let recent: (LocationPoint & { timestamp: number }) | null = null;
let pending: Promise<LocationPoint> | null = null;

export function recentMapLocation(): LocationPoint | null {
  return recent && Date.now() - recent.timestamp < 60000 ? recent : null;
}

/** One non-blocking coarse fix, shared across mounts; no duplicate GPS request. */
export function locateMap(force = false): Promise<LocationPoint> {
  if (pending) return pending;
  const cached = recentMapLocation();
  if (!force && cached) return Promise.resolve(cached);
  if (!navigator.geolocation) return Promise.reject(new Error("Prohlížeč nepodporuje zjištění polohy."));
  pending = new Promise<LocationPoint>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(position => {
      recent = { point: [position.coords.latitude, position.coords.longitude], accuracy: position.coords.accuracy, timestamp: position.timestamp };
      resolve(recent);
    }, error => {
      if (error.code === 1) recent = null;
      reject(new Error(error.code === 1 ? "Povol přístup k poloze v nastavení prohlížeče." : "Polohu se nepodařilo zjistit. Zkus to znovu."));
    }, { enableHighAccuracy: false, maximumAge: force ? 0 : 60000, timeout: 6000 });
  }).finally(() => { pending = null; });
  return pending;
}
