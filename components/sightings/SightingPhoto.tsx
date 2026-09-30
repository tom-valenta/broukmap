/* eslint-disable @next/next/no-img-element -- Private bucket images use short-lived signed URLs. */
"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { createClient } from "@/lib/supabase/client";
import { sightingPhotoPath } from "@/lib/sighting-photo";

const TTL_MS = 75_000;
const urlCache = new Map<string, { expiresAt: number; request: Promise<string | null> }>();
const preloadCache = new Map<string, { expiresAt: number; request: Promise<void> }>();

export function signedSightingPhotoUrl(value: string | null, width: number, quality = 75) {
  const path = sightingPhotoPath(value);
  if (!path) return Promise.resolve(null);
  const key = `${path}:${width}:${quality}`;
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.request;
  // Storage defaults to `cover`, which crops when only the width is set.
  const request = createClient().storage.from("sighting-photos").createSignedUrl(path, 90, { transform: { width, quality, resize: "contain" } })
    .then(({ data, error }) => error ? null : data.signedUrl)
    .catch(() => null);
  urlCache.set(key, { expiresAt: Date.now() + TTL_MS, request });
  return request;
}

/** Warms the browser image cache without rendering an image into the UI. */
export function preloadSightingPhoto(value: string | null, width: number, quality = 75): Promise<void> {
  const path = sightingPhotoPath(value);
  if (!path) return Promise.resolve();
  const key = `${path}:${width}:${quality}`;
  const cached = preloadCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.request;
  const request = signedSightingPhotoUrl(path, width, quality).then(url => new Promise<void>(resolve => {
    if (!url) return resolve();
    const image = new Image();
    image.decoding = "async";
    image.onload = image.onerror = () => resolve();
    image.src = url;
  }));
  preloadCache.set(key, { expiresAt: Date.now() + TTL_MS, request });
  return request;
}

export function useSightingPhotoUrl(value: string | null, width: number, quality = 75) {
  const path = sightingPhotoPath(value);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!path) return;
    void signedSightingPhotoUrl(path, width, quality).then(result => { if (active) setUrl(result); });
    return () => { active = false; };
  }, [path, width, quality]);
  return url;
}

export function SightingPhoto({ path, width, ...props }: { path: string | null; width: number } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const url = useSightingPhotoUrl(path, width);
  return url ? <img src={url} {...props} /> : null;
}
