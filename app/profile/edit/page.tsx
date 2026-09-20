import { redirect } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { getCurrentUserId, getProfileById, updateDisplayName } from "@/lib/user";
import ChangeAvatarButton from "@/components/ChangeAvatarButton";
import EditProfileForm from "@/components/EditProfileForm";

export default async function EditProfile() {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect("/login");

  const profile = await getProfileById(currentUserId);
  if (!profile) redirect("/login");

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-3xl rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar
              profile={profile}
              size={112}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white dark:border-slate-900 shadow-sm"
            />
            <p className="dark:text-slate-200 text-stone-700 font-bold">{profile.username}</p>
          </div>
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