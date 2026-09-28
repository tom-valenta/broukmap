"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function moderateSighting(id: string, action: "dismiss" | "hide" | "delete", reportIds: string[]) {
  const supabase = await createClient();
  const { data: admin, error: authError } = await supabase.rpc("is_admin");
  if (authError || !admin) return { error: "Tato akce je dostupná pouze administrátorům." };
  const { error } = await supabase.rpc("moderate_sighting", {
    p_sighting_id: id, p_action: action, p_report_ids: reportIds,
  });
  if (error) return { error: "Akci se nepodařilo dokončit. Obnov stránku a zkus to znovu." };
  revalidatePath("/admin");
  revalidatePath(`/admin/sightings/${id}`);
  revalidatePath(`/sightings/${id}`);
  revalidatePath("/map");
  return { error: null };
}
