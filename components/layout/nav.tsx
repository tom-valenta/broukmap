"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "../ThemeSwapButton";
import UserAvatar from "../UserAvatar";
import {
  Search,
  Bell,
  ChevronDown,
  Map,
  BookOpen,
  Zap,
  UserRound,
  Menu,
  X,
  LogOutIcon,
  Home,
} from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const { user, profile } = useAuth();
  const username = profile?.username ?? null;

  const pathname = usePathname();
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  // zavřít hamburger panel při změně velikosti okna nad lg breakpoint
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setHamburgerOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // zavřít user menu a notifikace při kliknutí kamkoli mimo ně
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      const clickedOutsideDesktopNotif =
        !notifRef.current || !notifRef.current.contains(target);
      const clickedOutsideMobileNotif =
        !mobileNotifRef.current || !mobileNotifRef.current.contains(target);

      if (clickedOutsideDesktopNotif && clickedOutsideMobileNotif) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // zavřít user menu a notifikace klávesou Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const navLinks = [
    { href: "/map", label: "Mapa nálezů" },
    { href: "/atlas", label: "Atlas druhů" },
    { href: "/objevovat", label: "Objevovat" },
    { href: "/komunita", label: "Komunita" },
    { href: "/statistiky", label: "Statistiky" },
  ];

  // odkazy, které se na mobilu nevešly do spodního quick menu -> jsou v hamburgeru
  const hamburgerExtraLinks = [
    { href: "/objevovat", label: "Objevovat" },
    { href: "/komunita", label: "Komunita" },
    { href: "/statistiky", label: "Statistiky" },
  ];

  // spodní quick menu pro mobil
  const bottomNavLinks = [
    { href: "/", label: "Domů", icon: Home },
    { href: "/map", label: "Mapa", icon: Map },
    { href: "/atlas", label: "Atlas", icon: BookOpen },
    { href: "/aktivita", label: "Aktivita", icon: Zap },
    { href: `/profile/${username}`, label: "Profil", icon: UserRound },
  ];

  return (
    <>
      <div className="w-full relative z-40">
        <nav className="relative w-full min-h-20 bg-white dark:bg-slate-950 backdrop-blur-md border-b border-stone-200/90 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 shadow-sm">
          {/* Mobile search overlay: přes celý nav (logo i tlačítka), max prostor pro psaní */}
          {mobileSearchOpen && (
            <div className="lg:hidden absolute inset-0 z-30 flex items-center gap-2 px-3 sm:px-6 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 px-3 h-11 rounded-full border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-400 flex-1 min-w-0 focus-within:border-emerald-600 dark:focus-within:border-emerald-500">
                <Search className="w-4.5 h-4.5 shrink-0" />
                <input
                  autoFocus
                  type="search"
                  placeholder="Hledat druh..."
                  className="bg-transparent outline-none text-sm w-full min-w-0 placeholder:text-stone-700 dark:placeholder:text-slate-400 text-stone-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"
                aria-label="Zavřít hledání"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0">
              <Image
                src="/logo-dark.png"
                width={48}
                height={48}
                alt="BroukMap"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-stone-900 dark:text-white tracking-tight truncate hidden sm:inline">
              BroukMap
            </span>
          </Link>

          {/* Desktop odkazy */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-2 ml-3 xl:ml-6">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "px-3 xl:px-4.5 py-2 xl:py-2.5 rounded-full text-sm font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950 flex items-center gap-2 whitespace-nowrap"
                      : "px-3 xl:px-4.5 py-2 xl:py-2.5 rounded-full text-sm font-medium text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white whitespace-nowrap"
                  }
                >
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop pravá strana */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-3.5 shrink-0 ml-auto">
            <div className="flex items-center gap-2.5 px-3 xl:px-4 h-10 xl:h-11 rounded-full border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-stone-700 dark:text-slate-400 focus-within:border-emerald-600 dark:focus-within:border-emerald-500">
              <Search className="w-4.5 h-4.5 shrink-0" />
              <input
                type="search"
                placeholder="Hledat druh..."
                className="bg-transparent outline-none text-sm w-20 xl:w-40 placeholder:text-stone-700 dark:placeholder:text-slate-400 text-stone-900 dark:text-white"
              />
              <kbd className="hidden xl:inline text-xs font-medium text-stone-400 dark:text-slate-500">
                ⌘K
              </kbd>
            </div>

            <ThemeToggle />

            {user ? (
              <>
                <div className="hidden xl:block relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((open) => !open)}
                    className="relative w-11 h-11 flex items-center justify-center rounded-full text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />
                  </button>

                  {notifOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-lg py-2 w-72 z-50">
                      <span className="block px-4 py-2 text-sm font-semibold text-stone-700 dark:text-slate-200">
                        Oznámení
                      </span>
                      <div className="px-4 py-6 text-sm text-stone-700 dark:text-slate-400 text-center">
                        Žádná nová oznámení
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/pridat"
                  className="h-10 xl:h-11 px-3.5 xl:px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  + Přidat nález
                </Link>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 h-10 xl:h-11 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800"
                  >
                    <UserAvatar
                      profile={profile}
                      size={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <ChevronDown className="w-4.5 h-4.5 text-stone-700 dark:text-slate-400" />
                  </button>

                  {menuOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 w-56 z-50">
                      <Link
                        href={`/profile/${username}`}
                        className="block px-4 py-2.5 text-sm text-stone-700 dark:text-slate-400 truncate hover:bg-stone-50 dark:hover:bg-slate-800"
                      >
                        {username}
                      </Link>

                      <Link
                        href={`/profile/settings`}
                        className="block px-4 py-2.5 text-sm text-stone-700 dark:text-slate-400 truncate hover:bg-stone-50 dark:hover:bg-slate-800"
                      >
                        Nastavení
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-400 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 border-t dark:border-slate-700 border-slate-300"
                      >
                        Odhlásit se
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 xl:px-4 py-2 xl:py-2.5 text-sm font-medium text-stone-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 whitespace-nowrap"
                >
                  Přihlásit se
                </Link>
                <Link
                  href="/register"
                  className="h-10 xl:h-11 px-3.5 xl:px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium flex items-center whitespace-nowrap"
                >
                  Registrovat
                </Link>
              </>
            )}
          </div>

          {/* Mobile pravá strana */}
          {user ? (
            <div className="flex lg:hidden items-center gap-1.5 shrink-0 ml-auto relative">
              {!mobileSearchOpen && (
                <>
                  <button
                    onClick={() => setMobileSearchOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"
                    aria-label="Hledat druh"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  <ThemeToggle />

                  <Link
                    href="/pridat"
                    className="h-9 px-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    + Nález
                  </Link>

                  <button
                    onClick={() => setHamburgerOpen((open) => !open)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"
                    aria-controls="mobile-hamburger-panel"
                    aria-expanded={hamburgerOpen}
                  >
                    <span className="sr-only">Otevřít menu</span>
                    {hamburgerOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex lg:hidden items-center gap-1.5 shrink-0 ml-auto">
              {!mobileSearchOpen && (
                <>
                  <button
                    onClick={() => setMobileSearchOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"
                    aria-label="Hledat druh"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  <ThemeToggle />

                  <Link
                    href="/login"
                    className="px-2 py-2 text-xs sm:text-sm font-medium text-stone-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 whitespace-nowrap"
                  >
                    Přihlásit
                  </Link>
                  <Link
                    href="/register"
                    className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium flex items-center whitespace-nowrap shrink-0"
                  >
                    Registrovat
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Hamburger panel (jen mobil, jen přihlášení) */}
        {user && hamburgerOpen && (
          <div
            id="mobile-hamburger-panel"
            ref={hamburgerRef}
            className="lg:hidden w-full bg-white dark:bg-slate-950 border-x border-b border-stone-200/90 dark:border-slate-800 shadow-sm px-4 py-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2.5 px-4 py-2">
              <UserAvatar
                profile={profile}
                size={32}
                className="w-8 h-8 rounded-full"
              />
              <Link
                href={`/profile/${username}`}
                onClick={() => setHamburgerOpen(false)}
                className="text-sm text-stone-600 dark:text-slate-300 truncate hover:underline"
              >
                {username ?? user.email}
              </Link>
            </div>

            {hamburgerExtraLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setHamburgerOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-900"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 border-t border-stone-200 dark:border-slate-800" />

            <div ref={mobileNotifRef}>
              <button
                onClick={() => setNotifOpen((open) => !open)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5" />
                  Oznámení
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {notifOpen && (
                <div className="mx-4 mt-1 mb-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6 text-sm text-stone-700 dark:text-slate-400 text-center">
                  Žádná nová oznámení
                </div>
              )}
            </div>

            <div className="my-2 border-t border-stone-200 dark:border-slate-800" />

            <button
              onClick={handleLogout}
              className="mt-1 px-4 py-3 rounded-xl text-sm font-medium text-left text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-900 flex flex-row items-center gap-2"
            >
              <LogOutIcon className="w-4.5 h-4.5" />
              Odhlásit
            </button>
          </div>
        )}
      </div>

      {/* Spodní quick menu (jen mobil) */}
      <div className="lg:hidden fixed inset-x-4 bottom-4 z-[60]">
        <div className="mx-auto max-w-sm sm:max-w-md md:max-w-xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-stone-200/90 dark:border-slate-800 rounded-full shadow-lg flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2.5">
          {bottomNavLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-2 rounded-full"
              >
                <Icon
                  className={
                    active
                      ? "w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400"
                      : "w-5 h-5 sm:w-6 sm:h-6 text-stone-700 dark:text-slate-400"
                  }
                />
                <span
                  className={
                    active
                      ? "text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-xs sm:text-sm font-medium text-stone-700 dark:text-slate-400"
                  }
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
