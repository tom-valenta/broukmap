"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  FlaskConical,
  ImagePlus,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ArrowDown,
} from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="relative z-20 w-full bg-white dark:bg-gray-900 border-b border-gray-900/5 dark:border-white/10">
      <div className="flex w-full flex-wrap items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="Vaše Company" className="mx-auto h-12 w-auto dark:hidden" />
          <img src="/logo-dark.png" alt="Vaše Company" className="mx-auto h-12 w-auto hidden dark:block" />
          <span className="whitespace-nowrap text-xl font-bold dark:font-white">
            BroukMap
          </span>
        </a>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded p-2 text-sm text-green-800 md:hidden"
          aria-controls="navbar-default"
          aria-expanded={menuOpen}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="h-6 w-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </button>

        <div
          id="navbar-default"
          className={`${menuOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
        >
          <ul className="font-bold mt-4 flex flex-col gap-2 rounded p-4 md:mt-0 md:flex-row md:gap-8 md:bg-transparent md:p-0">
            <li>
              <input
                type="search"
                placeholder="Hledat"
                className="font-bold border-gray-500 border rounded-md"
              />
            </li>
            <li>
              <a href="/about" className="font-bold">Mapa</a>
            </li>
            <li>
              <a href="/services" className="font-bold">Přidat</a>
            </li>
            <li>
              <a href="/pricing" className="font-bold">Objevovat</a>
            </li>
          </ul>
        </div>

        <div className="flex flex-row gap-1 justify-center items-center">
          {user ? (
            <>
              <span className="dark:text-white px-2 py-1 font-bold text-sm">
                {user.email} 
              </span>

              <button
                onClick={handleLogout}
                className="cursor-pointer dark:text-white text-white rounded-md bg-green-900 px-2 py-1 font-bold transition-all duration-150 ease-in hover:bg-green-700"
              >
                Odhlásit
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="dark:text-white px-2 py-1 font-bold transition-all duration-150 ease-in hover:text-green-700">
                Přihlásit
              </a>
              <a href="/register" className="dark:text-white text-white rounded-md bg-green-900 px-2 py-1 font-bold transition-all duration-150 ease-in hover:bg-green-700">
                Registrovat
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}