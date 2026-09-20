"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "./action";
import { useAuth } from "../contexts/AuthProvider";

export default function CompleteProfileForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useAuth();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    const result = await completeProfile(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await refreshProfile();     // aktualizuje client state (Navbar) okamžitě
    router.refresh();           // invaliduje Next.js cache server komponent na téhle route
    router.push("/");           // plynulá SPA navigace, žádný reload
  }

  return (
    <form action={handleSubmit} className="space-y-3">
     <input
  type="text"
  name="username"
  placeholder="Uživatelské jméno"
  required
  minLength={3}
  className="w-full rounded-md border px-3 py-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white text-stone-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-500"
/>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
         className="flex w-full justify-center rounded-md bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-emerald-700 transition-all duration-200 ease-in px-3 py-1.5 text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? "Ukládám..." : "Pokračovat"}
      </button>
    </form>
  )
}