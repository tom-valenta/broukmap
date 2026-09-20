import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CompleteProfileForm from "./form";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      {/* dekorativní animované pozadí */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-md rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-center text-2xl/9 my-4 font-bold tracking-tight dark:text-white text-stone-900">
            Dokončete svůj profil
          </h1>
          <p className="text-sm dark:*:text-slate-400 text-slate-600">
            Zadejte své jméno, které se bude zobrazovat ve vašem profilu.
          </p>
        </div>
        <CompleteProfileForm />
      </div>
    </div>
  );
}
