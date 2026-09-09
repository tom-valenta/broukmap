"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Tento email už je zaregistrovaný."
          : "Něco se pokazilo, zkuste to znovu."
      );
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex h-full w-full flex-col justify-center px-6 py-12 lg:px-8 dark:text-white bg-slate-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800/50 mx-auto w-full max-w-md rounded-2xl ring shadow-xl ring-gray-900/5 p-6 text-center">
          <h2 className="text-2xl/9 font-bold tracking-tight dark:text-white">
            Zkontrolujte email
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Poslali jsme vám potvrzovací odkaz. Klikněte na něj pro dokončení registrace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-12 lg:px-8 dark:text-white bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800/50 mx-auto w-full max-w-md rounded-2xl ring shadow-xl ring-gray-900/5 p-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img src="/logo.png" alt="Vaše Company" className="mx-auto h-20 w-auto dark:hidden" />
          <img src="/logo-dark.png" alt="Vaše Company" className="mx-auto h-20 w-auto hidden dark:block" />
          <h2 className="text-center text-2xl/9 font-bold tracking-tight dark:text-white">
            Registrace
          </h2>
        </div>

        <div className="flex flex-row gap-2 mt-4">
          <button type="button" className="flex-1 border border-gray-300 dark:bg-gray-900 py-2 rounded-2xl">
            Google
          </button>
          <button type="button" className="flex-1 border border-gray-300 dark:bg-gray-900 py-2 rounded-2xl">
            Apple
          </button>
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm/6 font-bold">
                Uživatelské jméno
              </label>
              <div className="mt-2">
                <input
                  id="displayName"
                  type="text"
                  placeholder="UzivatelskoJmeno"
                  name="displayName"
                  required
                  autoComplete="name"
                  className="block w-full border border-gray-300 rounded-md bg-white/5 px-3 py-1.5 text-base dark:text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm/6 font-bold">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  placeholder="vas@email.cz"
                  name="email"
                  required
                  autoComplete="email"
                  className="block w-full border border-gray-300 rounded-md bg-white/5 px-3 py-1.5 text-base dark:text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm/6 font-bold">
                Heslo
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  placeholder="*********"
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="block w-full border rounded-md border-gray-300 bg-white/5 px-3 py-1.5 text-base dark:text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-2xl bg-green-700 hover:bg-green-600 transition-all duration-200 ease-in px-3 py-1.5 text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registruji…" : "Zaregistrovat se"}
              </button>
            </div>
          </form>
          <p className="mt-5 text-center text-sm/6">
            Již máte účet?
            <a href="/login" className="font-semibold text-green-700 hover:text-green-600 cursor-pointer">
              {" "}Přihlaste se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}