"use server"

import { createClient } from "@/lib/supabase/server"

export async function completeProfile(formData: FormData) {
  const username = formData.get("username") as string

  if (!username || username.trim().length < 3) {
    return { error: "Uživatelské jméno musí mít alespoň 3 znaky" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nejsi přihlášen" }
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle()

  if (existing) {
    return { error: "Toto uživatelské jméno už je obsazené" }
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ username: username })
    .eq("id", user.id)
    .select()

  if (error || !updated || updated.length === 0) {
    return { error: "Něco se pokazilo, zkus to znovu" }
  }

  return { success: true }
}