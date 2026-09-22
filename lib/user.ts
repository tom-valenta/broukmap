import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getUserByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, created_at, avatar_url, display_name, bio, role")
    .eq("username", username)
    .maybeSingle();

  return data;
}

export async function getProfileById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, created_at, avatar_url, display_name, bio")
    .eq("id", id)
    .maybeSingle();

  return data;
}



export async function getCurrentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

export async function updateDisplayName(formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const displayName = (formData.get("display_name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();

  if (displayName && displayName.length > 50) {
    throw new Error("Display name too long");
  }
  if (bio && bio.length > 150) {
    throw new Error("Bio too long");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
    })
    .eq("id", userId)
    .select("username")
    .single();

  if (error) throw new Error("Failed to update display name");

  revalidatePath("/profile/edit");
  revalidatePath(`/profile/${data.username}`);
  redirect(`/profile/${data.username}`);
}

