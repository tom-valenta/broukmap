"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/user";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
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
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
    })
    .eq("id", userId);

  if (error) throw new Error("Failed to update profile");
}