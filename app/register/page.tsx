"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OAuthButton } from "@/components/OAuthButton";
import { AppleIcon } from "@/components/icons/AppleIcon";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { CircleAlert } from "lucide-react";

const USERNAME_REGEX = /^(?!.*\.\.)[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/;

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "invalid" | "checking" | "available" | "taken" | "error"
  >("idle");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

useEffect(() => {
  if (username.length === 0) {
    setUsernameStatus("idle");
    return;
  }

  if (!USERNAME_REGEX.test(username)) {
    setUsernameStatus("invalid");
    return;
  }

  setUsernameStatus("checking");

  const controller = new AbortController();

const timeout = setTimeout(async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("is_username_available", { desired_username: username })
    .abortSignal(controller.signal);

  if (controller.signal.aborted) return;

  if (error) {
    setUsernameStatus("error");
    return;
  }

  setUsernameStatus(data ? "available" : "taken");
}, 400);

  return () => {
    clearTimeout(timeout);
    controller.abort();
  };
}, [username]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Uživatelské jméno kontrolujeme průběžně (usernameStatus), ale těsně
    // před odesláním to ověříme ještě jednou pro jistotu (race condition).
    const { data: available, error: checkError } = await supabase.rpc(
      "is_username_available",
      { desired_username: username },
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

    // handle_new_user() v databázi čte raw_user_meta_data->>'username'.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    setLoading(false);

    if (error) {
      console.log(
        "AUTH ERROR:",
        error.message,
        error.code,
        error.status,
        error,
      );
      // Sem už by se v běžném provozu skoro nikdy nemělo dostat kvůli username,
      // jen při race condition. Obecná hláška je v pořádku.
      setError("Něco se pokazilo, zkuste to znovu.");
      return;
    }

    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      setError("Tento email už je zaregistrovaný.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="relative flex flex-1 w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none ">
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
    <div className="relative flex flex-1 w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
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
                htmlFor="username"
                className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
              >
                Uživatelské jméno
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  type="text"
                  placeholder="uzivatelske_jmeno"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  pattern="^(?!.*\.\.)[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$"
                  title="Uživatelské jméno smí obsahovat malá písmena, čísla, podtržítka a tečky (ne dvě tečky za sebou, ne na začátku ani na konci). Délka 3–20 znaků."
                  aria-invalid={
                    usernameStatus === "taken" || usernameStatus === "invalid"
                  }
                  className={
                    "block w-full rounded-md border px-3 py-1.5 text-base placeholder:text-gray-500 outline-none sm:text-sm/6 " +
                    (usernameStatus === "taken" || usernameStatus === "invalid"
                      ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100 dark:focus:border-red-500 dark:focus:ring-red-500"
                      : "border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500")
                  }
                />
              </div>

              {usernameStatus === "invalid" && (
                <p className="mt-1.5 text-sm text-red-700 dark:text-red-400 flex flex-row gap-2 items-center">
                  <CircleAlert className="h-5 w-5" />
                  Pouze malá písmena, čísla, podtržítka a tečky (ne na začátku,
                  na konci ani dvě za sebou), 3–20 znaků.
                </p>
              )}

              {usernameStatus === "taken" && (
                <p className="mt-1.5 text-sm text-red-700 dark:text-red-400 flex flex-row gap-2 items-center">
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

              {usernameStatus === "error" && (
                <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">
                  Kontrolu dostupnosti se nepodařilo provést, zkuste to znovu.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
              >
                Heslo znovu
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  placeholder="*********"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-invalid={passwordsMismatch}
                  className={
                    "block w-full rounded-md border px-3 py-1.5 text-base placeholder:text-gray-500 outline-none sm:text-sm/6 " +
                    (passwordsMismatch
                      ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100"
                      : "border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500")
                  }
                />
              </div>
              {passwordsMismatch && (
                <p className="mt-1.5 text-sm text-red-700 dark:text-red-400 flex flex-row gap-2 items-center">
                  <CircleAlert className="h-5 w-5" />
                  Hesla se neshodují.
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  loading || usernameStatus !== "available" || passwordsMismatch
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
