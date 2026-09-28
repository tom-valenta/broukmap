"use server";

import { createClient } from "@/lib/supabase/server";
import { sightingPhotoPath } from "@/lib/sighting-photo";

export async function reportSighting(sightingId: string, reason: string) {
  if (typeof reason !== "string" || !reason.trim()) return { error: "Napiš důvod nahlášení." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Pro nahlášení se přihlas." };
  const { error } = await supabase.from("reports").insert({ sighting_id: sightingId, user_id: user.id, reason: reason.trim() });
  return { error: error ? "Hlášení se nepodařilo uložit. Nález už nemusí být dostupný." : null };
}

export async function deleteOwnSighting(sightingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Pro smazání nálezu se přihlas." };
  const { data: sighting, error: readError } = await supabase.from("sightings").select("photo_url").eq("id", sightingId).eq("user_id", user.id).maybeSingle();
  if (readError || !sighting) return { error: "Nález se nepodařilo najít nebo k němu nemáš přístup." };
  const { data: gallery, error: galleryError } = await supabase.from("sighting_photo_sets").select("paths").eq("sighting_id", sightingId).maybeSingle();
  if (galleryError) return { error: "Fotografie se nepodařilo načíst. Zkus to znovu." };
  const { error: deleteError } = await supabase.from("sightings").delete().eq("id", sightingId).eq("user_id", user.id);
  if (deleteError) return { error: "Nález se nepodařilo smazat. Zkus to prosím znovu." };
  const paths = [...new Set([...(gallery?.paths ?? []), sighting.photo_url].map(sightingPhotoPath).filter((path): path is string => !!path))];
  if (paths.length) await supabase.storage.from("sighting-photos").remove(paths);
  return { error: null };
}
