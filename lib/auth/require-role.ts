// lib/auth/require-role.ts
"use server"

import { createClient } from "@/lib/supabase/server"

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin, error } = await supabase.rpc("is_admin")

  if (error || !isAdmin) {
    throw new Error("Nemáš oprávnění")
  }
}

export async function requireModeratorOrAdmin() {
  const supabase = await createClient()
  const { data: allowed, error } = await supabase.rpc("is_moderator_or_admin")

  if (error || !allowed) {
    throw new Error("Nemáš oprávnění")
  }
}