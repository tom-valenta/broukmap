"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DANGEROUS_CHARS_REGEX =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064]/;

const DISPLAY_NAME_LIMIT = 30;
const BIO_LIMIT = 150;

type ActionState = { error: string | null };

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const displayName = (formData.get("display_name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();

  if (displayName && displayName.length > DISPLAY_NAME_LIMIT) {
    return { error: "Zobrazované jméno je příliš dlouhé." };
  }
  if (displayName && DANGEROUS_CHARS_REGEX.test(displayName)) {
    return { error: "Zobrazované jméno obsahuje nepovolené znaky." };
  }
  if (bio && bio.length > BIO_LIMIT) {
    return { error: "Bio je příliš dlouhé." };
  }

  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    return { error: "Profil nenalezen." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName ? displayName.normalize("NFC") : null,
      bio: bio || null,
    })
    .eq("id", userId);

  if (error) {
    return { error: "Nepodařilo se uložit profil." };
  }

  revalidatePath(`/profile/${existingProfile.username}`);
  redirect(`/profile/${existingProfile.username}`);
}

export async function updateAvatarUrl(avatarUrl: string | null) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select("username")
    .single();

  if (error) throw new Error("Failed to update avatar");

  revalidatePath("/profile/edit");
  revalidatePath(`/profile/${data.username}`);
}