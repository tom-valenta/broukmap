"use client";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import type { Database } from "@/lib/supabase/database.types";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  MessageSquare,
  Share2,
  Download,
  Award,
  ShieldCheck,
  Sparkles,
  Landmark,
  Pencil,
} from "lucide-react";



type ProfileHeaderCardProps = {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    created_at: string | null;
    display_name: string | null;
    bio: string | null;
    role: Database["public"]["Enums"]["profile_role"] | null;
  };
  isOwnProfile: boolean;
};

const monthNames = [
  "ledna",
  "února",
  "března",
  "dubna",
  "května",
  "června",
  "července",
  "srpna",
  "září",
  "října",
  "listopadu",
  "prosince",
];

export default function ProfileHeaderCard({
  profile,
  isOwnProfile,
}: ProfileHeaderCardProps) {
  const { username, display_name, bio, created_at, role } = profile;

  const isAdmin = role === "admin";

const memberSince = created_at
  ? new Date(created_at).toLocaleDateString("cs-CZ", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
  : null;

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl border border-stone-200 dark:border-slate-500 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Cover banner */}
      <div
        className="relative h-32 md:h-40 w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(16,185,129,0.25) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 -translate-x-1/4 translate-y-1/4 w-72 h-72 rounded-full bg-emerald-500/30 dark:bg-emerald-500/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Top-right small badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[65%] sm:max-w-none flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            Coleoptera Specialist
            <span className="hidden sm:inline"> · BioLib #49102</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 sm:max-w-none flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium">
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              type="button"
              className="flex items-center justify-center gap-1 sm:gap-2 text-white bg-emerald-800 hover:bg-emerald-700 border dark:border-slate-200 border-emerald-900  dark:bg-slate-800/60 dark:hover:bg-slate-600 dark:text-text-slate-200 font-bold py-2 sm:py-3 px-0 sm:px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span className="truncate">Upravit profil</span>
            </Link>
          )}
        </div>
      </div>

      {/* Header content */}
      <div className="px-4 sm:px-5 md:px-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-12">
          {/* Left: avatar + name */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="relative shrink-0 mx-auto md:mx-0">
              <UserAvatar
                profile={profile}
                size={112}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white dark:border-slate-900 shadow-sm"
              />
            </div>

            <div className="pb-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  {display_name || username}
                </h1>
                {isAdmin && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 text-xs font-medium px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs font-medium px-2.5 py-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Top 1% mapovatelů
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1 text-sm">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold fle">
                  @{username}
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  Členem od {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors flex-1 md:flex-none min-w-0"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">Konzultovat určení</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors flex-1 md:flex-none min-w-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">Export nálezů</span>
            </button>
          </div>
        </div>

        {/* Bio */}

        {bio && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl mx-auto md:mx-0 p-2 break-words">
            {bio}
          </p>
        )}

        {/* Achievement badges */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Zlatý determinátor (Top 1%)
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Strážce přírody 2024
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            100+ ověřených vzácných druhů
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Landmark className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            Certifikovaný taxonom AOPK ČR
          </span>
        </div>
      </div>
    </div>
  );
}
