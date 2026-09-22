"use server";

import { createClient } from "@/lib/supabase/server";

export type UserSearchResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const escaped = trimmed.replace(/[%_]/g, (char) => `\\${char}`);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .or(`username.ilike.${escaped}%,display_name.ilike.%${escaped}%`)
    .limit(6)
    .order("username", { ascending: true });

  if (error) {
    console.error("searchUsers error:", error);
    return [];
  }

  return data;
}
