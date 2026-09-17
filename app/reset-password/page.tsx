"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PasswordResetForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/new-password`,
    });

    setLoading(false);

    if (error) {
      setError("Něco se pokazilo, zkuste to prosím znovu.");
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-md rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            src="/logo.png"
            alt="Vaše Company"
            className="mx-auto h-20 w-auto dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Vaše Company"
            className="mx-auto h-20 w-auto hidden dark:block"
          />
        </div>

        {success ? (
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold leading-9 tracking-tight dark:text-slate-300 text-stone-700">
              Zkontrolujte svůj e-mail
            </h2>
            <p className="mt-2 text-sm/6 text-stone-600 dark:text-slate-400">
              Pokud e-mail existuje v naší databázi, poslali jsme na něj odkaz pro resetování hesla.
              Pokud se e-mail neobjeví během pár minut, zkontrolujte prosím složku se spamem.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400"
            >
              Zpět na přihlášení
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight dark:text-slate-300 text-stone-700">
              Resetování hesla
            </h2>

            <p className="mt-2 text-center text-sm/6 text-stone-600 dark:text-slate-400">
              Zadejte e-mail, který je pravděpodobně přidružený k vašemu účtu. V případě shody vám pošleme odkaz pro resetování hesla.
            </p>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
                >
                  Email
                </label>

                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Zadejte svůj email"
                    className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm/6 font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-emerald-500"
                >
                  {loading ? "Odesílání..." : "Resetovat heslo"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}