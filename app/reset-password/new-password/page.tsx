"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetNewPasswordForm() {
    const router = useRouter();
    const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
    const [checkingFlow, setCheckingFlow] = useState(true);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsRecoveryFlow(true);
                setCheckingFlow(false);
            }
        });

        // Fallback, kdyby event PASSWORD_RECOVERY přišel dřív než se listener zaregistroval
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setIsRecoveryFlow(true);
            setCheckingFlow(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (checkingFlow) {
        return null;
    }

    if (!isRecoveryFlow) {
        return (
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
                    <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
                </div>
                <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-md rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6">
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight dark:text-slate-300 text-stone-700">
                        Tento odkaz pro reset hesla je neplatný nebo vypršel.
                    </h2>
                    <p className="mt-2 text-center text-sm/6 text-stone-600 dark:text-slate-400">
                        Zkuste prosím znovu požádat o reset hesla.
                    </p>
                </div>
            </div>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!password || !confirmPassword) {
            setError("Vyplňte obě pole pro nové heslo.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Hesla se neshodují.");
            return;
        }

        if (password.length < 8) {
            setError("Heslo musí mít alespoň 8 znaků.");
            return;
        }

        setLoading(true);

        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        setLoading(false);

        if (updateError) {
            console.error(updateError);
            setError(updateError.message);
            return;
        }

        router.push("/reset-password/confirmation");
    }

    return (
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
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

                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight dark:text-slate-300 text-stone-700">
                    Nastavení nového hesla
                </h2>

                <p className="mt-2 text-center text-sm/6 text-stone-600 dark:text-slate-400">
                    Zadejte nové heslo, které chcete použít pro svůj účet.
                </p>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="new-password"
                            className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
                        >
                            Nové heslo
                        </label>
                        <div className="mt-2">
                            <input
                                id="new-password"
                                type="password"
                                name="new-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm/6 font-bold dark:text-slate-300 text-stone-700"
                        >
                            Potvrzení nového hesla
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirm-password"
                                type="password"
                                name="confirm-password"
                                required
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                className="block w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-base text-stone-900 placeholder:text-gray-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-2 dark:focus:ring-emerald-500 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    {error ? (
                        <p className="text-sm text-red-600 dark:text-red-400" aria-live="polite">
                            {error}
                        </p>
                    ) : null}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:outline-emerald-500"
                        >
                            {loading ? "Ukládám..." : "Nastavit nové heslo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}