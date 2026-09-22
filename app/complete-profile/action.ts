"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeProfile(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Neplatné uživatelské jméno" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nejsi přihlášen" };
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("has_set_username")
    .eq("id", user.id)
    .single();

  if (profileError || currentProfile?.has_set_username) {
    return { error: "Uživatelské jméno už bylo nastaveno" };
  }

  // Rychlý UX feedback – nechává se, ale nechrání proti race condition
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existingError) {
    return { error: "Nepodařilo se ověřit dostupnost jména" };
  }

  if (existing) {
    return { error: "Toto uživatelské jméno už je obsazené" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      username,
      has_set_username: true,
    })
    .eq("id", user.id);

  if (updateError) {
    // Skutečná ochrana proti race condition – DB UNIQUE constraint
    if (updateError.code === "23505") {
      return { error: "Toto uživatelské jméno už je obsazené" };
    }
    return { error: "Něco se pokazilo, zkus to znovu" };
  }

  return { success: true };
}