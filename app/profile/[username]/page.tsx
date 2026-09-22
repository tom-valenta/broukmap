import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProfileFindingsSection from "@/components/ProfileFindingsSection";
import HeroCard from "@/components/HeroCard";
import { getCurrentUserId, getUserByUsername } from "@/lib/user";
import ProfileHeaderCard from "@/components/ProfileHeaderCard";
import UserSearchBar from "../ProfileSearchBar";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  MapIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react";

/* ---------- shared class strings (same palette as the homepage) ---------- */

const pageBtnBase =
  "flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors";

const pageBtnIdle = `${pageBtnBase} text-stone-700 hover:bg-stone-200 dark:text-slate-200 dark:hover:bg-slate-800`;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const lowerUsername = decodedUsername.toLocaleLowerCase();

  if (decodedUsername !== lowerUsername) {
    redirect(`/profile/${lowerUsername}`);
  }

  const profileUser = await getUserByUsername(decodeURIComponent(username));
  if (!profileUser) notFound();

  const currentUserId = await getCurrentUserId();
  const isOwnProfile = currentUserId === profileUser.id;

  return (
    <>
      {/* Hlavička profilu + statistiky */}
      <section className="px-5 md:px-10 lg:px-16 py-12 lg:py-24 bg-linear-to-b from-[#f6f7f1] via-emerald-50 to-stone-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto">
          <UserSearchBar />

          <ProfileHeaderCard
            profile={profileUser}
            isOwnProfile={isOwnProfile}
          />

          <div className="py-8 md:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-stretch">
              <HeroCard
                icon={MapIcon}
                iconColor="dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-100 text-stone-800 border-emerald-300"
                number="14 850"
                title="Zmapovaných nálezů"
                description="z celého území ČR"
              />
              <HeroCard
                icon={UsersIcon}
                iconColor="dark:bg-lime-950/50 dark:text-lime-400 dark:border-lime-300/30 bg-lime-100 text-stone-800 border-lime-300"
                number="1 420"
                title="Terénních mapovatelů"
                description="amatérů i profesionálů"
              />
              <HeroCard
                icon={CheckCircleIcon}
                iconColor="dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800 bg-teal-100 text-stone-800 border-teal-300"
                number="100%"
                title="Kontrola komunitou"
                description="pro správné určení"
              />
              <HeroCard
                icon={AlertTriangleIcon}
                iconColor="dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-300/30 bg-amber-100 text-stone-800 border-amber-300"
                number="182"
                title="Ohrožených druhů"
                description="přidáno do NDOP pro ochranu"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Záložky + nálezy (tabs + filter + grid, all tab-driven) */}
      <ProfileFindingsSection />

      {/* Synchronizace + stránkování */}
      <section
        className={
          "w-full bg-stone-100 dark:bg-slate-900 border-y border-stone-300 dark:border-slate-800 py-5 px-5 md:px-10 lg:px-16"
        }
      >
        <div className="w-full flex flex-col lg:flex-row max-w-7xl mx-auto justify-between items-center gap-4 lg:gap-6">
          <div className="min-w-0 flex flex-row gap-2 items-center text-sm text-left text-stone-700 dark:text-slate-300">
            <RefreshCwIcon className="w-5 h-5 shrink-0 text-emerald-700 dark:text-emerald-500" />
            <span>
              Všechna data jsou synchronizována s národní databází NDOP AOPK ČR
              (poslední záloha dnes v 04:00)
            </span>
          </div>

          <ul className="flex flex-row gap-2 items-center shrink-0">
            <li className="shrink-0">
              <button
                type="button"
                disabled
                className="flex items-center rounded-lg px-3 sm:px-4 py-2 text-sm font-medium bg-white text-stone-400 border border-stone-300 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
              >
                Předchozí
              </button>
            </li>

            <li className="shrink-0">
              <button
                type="button"
                aria-current="page"
                className={`${pageBtnBase} font-semibold bg-emerald-700 text-white dark:bg-emerald-600`}
              >
                1
              </button>
            </li>

            <li className="shrink-0 hidden sm:block">
              <button type="button" className={pageBtnIdle}>
                2
              </button>
            </li>
            <li className="shrink-0 hidden sm:block">
              <button type="button" className={pageBtnIdle}>
                3
              </button>
            </li>
            <li className="shrink-0 hidden sm:block">
              <span className="flex items-center justify-center w-9 h-9 text-sm text-stone-400 dark:text-slate-500">
                ...
              </span>
            </li>
            <li className="shrink-0 hidden sm:block">
              <button type="button" className={pageBtnIdle}>
                48
              </button>
            </li>

            <li className="shrink-0">
              <button
                type="button"
                className="flex items-center rounded-lg px-3 sm:px-4 py-2 text-sm font-medium bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
              >
                Další
              </button>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
