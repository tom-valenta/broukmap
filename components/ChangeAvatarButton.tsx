"use client";

import { useEffect, useRef, useState } from "react";

export default function ChangeAvatarButton({
  hasPhoto,
}: {
  hasPhoto: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: nahrát do Storage + update profiles.avatar_url
    setOpen(false);
  }

  function handleRemove() {
    // TODO: update profiles set avatar_url = null
    setOpen(false);
  }

  const row =
    "w-full border-t border-stone-200 px-4 py-3.5 text-sm dark:border-slate-700";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-fit rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 cursor-pointer"
      >
        Změnit fotku
      </button>

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
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>
      )}
    </>
  );
}