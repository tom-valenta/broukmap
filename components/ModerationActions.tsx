"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateSighting } from "@/app/admin/actions";

export default function ModerationActions({ id, reportIds, hidden }: { id: string; reportIds: string[]; hidden: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  function run(action: "dismiss" | "hide" | "delete") {
    setError(null);
    startTransition(async () => {
      try {
        const result = await moderateSighting(id, action, reportIds);
        if (result.error) setError(result.error);
        else if (action === "delete") router.push("/admin");
        else router.refresh();
      } catch { setError("Spojení se nezdařilo. Obnov stránku a ověř výsledek akce."); }
    });
  }
  const button = "min-h-11 rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50";
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={pending || !reportIds.length} onClick={() => run("dismiss")}>Zamítnout zobrazené reporty</button>
      <button className={`${button} border-amber-500 text-amber-700 dark:text-amber-300`} disabled={pending || hidden} onClick={() => run("hide")}>Skrýt nález</button>
      <button className={`${button} border-red-500 text-red-700 dark:text-red-300`} disabled={pending} onClick={() => setConfirmDelete(true)}>Trvale smazat…</button>
    </div>
    <p className="text-sm text-stone-500 dark:text-slate-400">Zamítnutí reportů stav nálezu nemění. Nová hlášení přijatá během kontroly zůstanou nevyřízená.</p>
    {confirmDelete && <div role="alert" className="space-y-3 rounded-xl border border-red-400 p-4">
      <p>Trvale smazat nález a jeho hlášení a určení? Tuto akci nelze vrátit.</p>
      <button className={`${button} mr-3 bg-red-700 text-white`} disabled={pending} onClick={() => run("delete")}>Ano, trvale smazat</button>
      <button className={button} disabled={pending} onClick={() => setConfirmDelete(false)}>Zrušit</button>
    </div>}
    {pending && <p role="status">Ukládám…</p>}
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}
