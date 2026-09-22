"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { prepareAvatarFile, avatarExtension, AvatarFileError } from "@/lib/avatar";
import { updateAvatarUrl } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function ChangeAvatarButton({
  hasPhoto,
}: {
  hasPhoto: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  setError(null);
  setUploading(true);
  setOpen(false);

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nepřihlášen");

    const prepared = await prepareAvatarFile(file);
    const path = `${user.id}/avatar.${avatarExtension(prepared)}`;

    // Smazat staré avatary uživatele (jiné přípony by jinak zůstaly osiřelé)
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const pathsToRemove = existingFiles.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from("avatars").remove(pathsToRemove);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, prepared, {
        upsert: true,
        contentType: prepared.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    await updateAvatarUrl(`${publicUrl}?v=${Date.now()}`);
    router.refresh();
  } catch (err) {
    setError(
      err instanceof AvatarFileError
        ? err.message
        : "Nahrání se nepovedlo, zkuste to prosím znovu."
    );
  } finally {
    setUploading(false);
  }
}

async function handleRemove() {
  setOpen(false);
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nepřihlášen");

    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const pathsToRemove = existingFiles.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from("avatars").remove(pathsToRemove);
    }

    await updateAvatarUrl(null);
    router.refresh();
  } catch {
    setError("Odebrání se nepovedlo.");
  }
}

  const row =
    "w-full border-t border-stone-200 px-4 py-3.5 text-sm dark:border-slate-700";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={uploading}
        className="h-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
      >
        {uploading ? "Nahrávám…" : "Změnit fotku"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="px-4 py-6 text-lg text-slate-900 dark:text-white">
              Změnit profilovou fotku
            </h2>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${row} font-bold text-blue-600 hover:bg-stone-50 dark:text-blue-400 dark:hover:bg-slate-800`}
            >
              Nahrát fotku
            </button>

            {hasPhoto && (
              <button
                type="button"
                onClick={handleRemove}
                className={`${row} font-bold text-red-600 hover:bg-stone-50 dark:text-red-400 dark:hover:bg-slate-800`}
              >
                Odebrat aktuální fotku
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`${row} text-slate-900 hover:bg-stone-50 dark:text-white dark:hover:bg-slate-800`}
            >
              Zrušit
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>
      )}
    </>
  );
}