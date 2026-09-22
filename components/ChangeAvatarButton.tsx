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

    // 1. Nahrát nový avatar (upsert přepíše, pokud je stejná cesta/přípona)
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

    // 2. Uložit novou URL do profilu — teprve teď je nový avatar "aktivní"
    await updateAvatarUrl(`${publicUrl}?v=${Date.now()}`);
    router.refresh();

    // 3. Cleanup — smazat staré soubory (jiná přípona), ale nechat ten nový
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (listError) {
      console.error("Avatar cleanup - list failed:", listError);
    } else {
      const oldPaths =
        existingFiles
          ?.map((f) => `${user.id}/${f.name}`)
          .filter((filePath) => filePath !== path) ?? [];

      if (oldPaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove(oldPaths);

        if (removeError) {
          console.error("Avatar cleanup - remove failed:", removeError);
        }
      }
    }
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

    // 1. Nejdřív odstranit odkaz z profilu — tohle je to, co uživatel vidí
    await updateAvatarUrl(null);
    router.refresh();

    // 2. Pak uklidit Storage — selhání zde už nezablokuje odebrání fotky z profilu
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (listError) {
      console.error("Avatar removal - list failed:", listError);
      return;
    }

    if (existingFiles && existingFiles.length > 0) {
      const pathsToRemove = existingFiles.map((f) => `${user.id}/${f.name}`);
      const { error: removeError } = await supabase.storage
        .from("avatars")
        .remove(pathsToRemove);

      if (removeError) {
        console.error("Avatar removal - remove failed:", removeError);
      }
    }
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