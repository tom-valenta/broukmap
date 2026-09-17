"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OAuthButton } from "@/components/OAuthButton";
import { AppleIcon } from "@/components/icons/AppleIcon";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { CircleAlert } from "lucide-react";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");

  useEffect(() => {
    const trimmed = displayName.trim();

    // krátká/prázdná jména nekontrolujeme (ať to nespamuje dotazy hned od prvního znaku)
    if (trimmed.length < 3 || !/^[a-zA-Z0-9_.]{1,30}$/.test(trimmed)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("is_username_available", {
        desired_username: trimmed,
      });

      if (error) {
        setUsernameStatus("error");
        return;
      }

      setUsernameStatus(data ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [displayName]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  const formData = new FormData(e.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = createClient();

  // Jméno už kontrolujeme průběžně při psaní (usernameStatus), ale těsně před
  // odesláním to ověříme ještě jednou pro jistotu (uživatel mohl čekat s odesláním).
  const { data: available, error: checkError } = await supabase.rpc(
    "is_username_available",
    { desired_username: displayName }
  );

  if (checkError) {
    setError("Něco se pokazilo, zkuste to znovu.");
    setLoading(false);
    return;
  }

  if (!available) {
    setUsernameStatus("taken");
    setLoading(false);
    return;
  }

  // Teprve teď signUp
  const { data, error } = await supabase.auth.signUp({
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
    console.log("AUTH ERROR:", error.message, error.code, error.status, error);
    // Sem už by se v běžném provozu skoro nikdy nemělo dostat kvůli display_name,
    // jen při race condition. Obecná hláška je v pořádku.
    setError("Něco se pokazilo, zkuste to znovu.");
    return;
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    setError("Tento email už je zaregistrovaný.");
    return;
  }

  setSuccess(true);
}



  if (success) {
    return (
      <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-stone-100 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-indigo-600/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative bg-white dark:bg-gray-800/50 mx-auto w-full max-w-md rounded-2xl ring shadow-xl ring-gray-900/5 p-6 text-center">
          <h2 className="text-2xl/9 font-bold tracking-tight dark:text-white">
            Zkontrolujte email
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Poslali jsme vám potvrzovací odkaz. Klikněte na něj pro dokončení
            registrace.
          </p>
        </div>

        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 14s infinite ease-in-out;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-blob {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      {/* dekorativní animované pozadí */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative bg-white dark:bg-gray-800/50 mx-auto w-full max-w-md rounded-2xl ring shadow-xl ring-gray-900/5 p-6">
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
          <h2 className="text-center text-2xl/9 my-4 font-bold tracking-tight dark:text-white text-stone-900">
            Registrace
          </h2>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <OAuthButton
            provider="google"
            label="Continue With Google"
            icon={<GoogleIcon />}
          />

          <OAuthButton
            provider="apple"
            label="Continue With Apple"
            icon={<AppleIcon />}
          />
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
             <p className="text-sm text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/60 px-3 py-2 rounded-md flex flex-row gap-2 items-center">
                <CircleAlert className="h-5 w-5" />
                {error}
              </p>
            )}

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
              >
                Uživatelské jméno
              </label>
              <div className="mt-2">
                <input
                  id="displayName"
                  type="text"
                  placeholder="UzivatelskoJmeno"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="name"
                  pattern="^[a-zA-Z0-9_.]{1,30}$"
                  title="Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a tečky. Maximální délka je 30 znaků."
                  aria-invalid={usernameStatus === "taken"}
                  className={
                    "block w-full rounded-md border px-3 py-1.5 text-base placeholder:text-gray-500 outline-none sm:text-sm/6 " +
                    (usernameStatus === "taken"
                      ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100 dark:focus:border-red-500 dark:focus:ring-red-500"
                      : "border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500")
                  }
                />
              </div>

              {usernameStatus === "taken" && (
                   <p className="text-sm text-red-700 dark:text-red-400   py-2 rounded-md flex flex-row gap-2 items-center">
                  <CircleAlert className="h-5 w-5" />
                  Uživatelské jméno není k dispozici.
                </p>
              )}

              {usernameStatus === "available" && (
                <p className="mt-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                  Uživatelské jméno je volné.
                </p>
              )}

              {usernameStatus === "checking" && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  Kontroluji dostupnost…
                </p>
              )}
            </div>

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
                  type="email"
                  placeholder="vas@email.cz"
                  name="email"
                  required
                  autoComplete="email"
                  className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
              >
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
                  className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  loading ||
                  usernameStatus === "taken" ||
                  usernameStatus === "checking"
                }
                className="flex w-full justify-center rounded-md bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-emerald-700 transition-all duration-200 ease-in px-3 py-1.5 text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registruji…" : "Zaregistrovat se"}
              </button>
            </div>
          </form>
          <p className="mt-5 text-center dark:text-slate-300 text-stone-700 text-sm/6">
            Již máte účet?
            <a
              href="/login"
              className="font-semibold dark:text-emerald-400 dark:hover:text-emerald-300 text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {" "}
              Přihlaste se
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 14s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}