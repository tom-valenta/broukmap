import { redirect } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import {
  getCurrentUserId,
  getProfileById,
  updateDisplayName,
} from "@/lib/user";
import ChangeAvatarButton from "@/components/ChangeAvatarButton";
import EditProfileForm from "@/components/EditProfileForm";
import { X } from "lucide-react";
import Link from "next/link";

export default async function EditProfile() {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect("/login");

  const profile = await getProfileById(currentUserId);
  if (!profile) redirect("/login");

  return (
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-md md:max-w-lg rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5 dark:border-slate-800">
          <div>
            <p className="text-lg font-semibold text-stone-900 dark:text-white">
              Nastavení účtu
            </p>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Spravujte své veřejné mapovatelské jméno a údaje
            </p>
          </div>
          <Link
            href={`/profile/${profile.username}`}
            aria-label="Zavřít"
            className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-slate-500 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        {/* Avatar + identity */}
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <UserAvatar
            profile={profile}
            size={112}
            className="h-28 w-28 rounded-2xl "
          />

          <p className="text-base font-semibold text-stone-900 dark:text-white">
            @{profile.username}
          </p>

          <ChangeAvatarButton hasPhoto={!!profile.avatar_url} />
        </div>

        <EditProfileForm
          action={updateDisplayName}
          username={profile.username}
          displayName={profile.display_name}
          bio={profile.bio}
        />
      </div>
    </div>
  );
}
