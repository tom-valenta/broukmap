import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProfileFindingsSection from "@/components/ProfileFindingsSection";
import HeroCard from "@/components/HeroCard";
import { getCurrentUserId, getUserByUsername } from "@/lib/user";
import ProfileHeaderCard from "@/components/ProfileHeaderCard";
import UserSearchBar from "../ProfileSearchBar";
import { Camera, Bug, BadgeCheck, Calendar } from "lucide-react";
export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }) {
  const { username } = await params; const decodedUsername = decodeURIComponent(username); const lowerUsername = decodedUsername.toLowerCase();
  if (decodedUsername !== lowerUsername) redirect(`/profile/${lowerUsername}`);
  const profile = await getUserByUsername(lowerUsername); if (!profile) notFound();
  const isOwnProfile = await getCurrentUserId() === profile.id;
  const query = await searchParams; const page = Math.max(1, Math.floor(Number(query.page) || 1)); const size = 24;
  const db = await createClient();
  const [findings, stats, badges] = await Promise.all([
    db.from("public_sightings").select("*", { count: "exact" }).eq("user_id", profile.id).order("created_at", { ascending: false }).order("id").range((page - 1) * size, page * size - 1),
    db.rpc("profile_sighting_stats", { p_user_id: profile.id }).single(),
    db.from("user_badges").select("id,label").eq("user_id", profile.id),
  ]);
  if (findings.error || stats.error || badges.error) throw new Error("Profilové nálezy se nepodařilo načíst.");
  const values = stats.data;
  return <>
    <section className="bg-linear-to-b from-[#f6f7f1] via-emerald-50 to-stone-50 px-5 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"><div className="mx-auto max-w-7xl">
      <UserSearchBar /><ProfileHeaderCard profile={profile} isOwnProfile={isOwnProfile} />
      <div className="grid grid-cols-2 gap-4 py-8 lg:grid-cols-4">{[
        { icon: Camera, number: values.sighting_count, title: "Nahraných nálezů" },
        { icon: Bug, number: values.species_count, title: "Potvrzených druhů" },
        { icon: BadgeCheck, number: values.confirmed_count, title: "Potvrzených nálezů" },
        { icon: Calendar, number: values.backdated_count, title: "Zpětných nálezů" },
      ].map(stat => <HeroCard key={stat.title} icon={stat.icon} number={String(stat.number)} title={stat.title} iconColor="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400" />)}</div>
      {isOwnProfile && <p className="text-sm text-stone-500 dark:text-slate-400">Tvoje historie a statistiky zahrnují i soukromé a skryté nálezy.</p>}
    </div></section>
    <ProfileFindingsSection sightings={findings.data ?? []} badges={badges.data ?? []} authorName={profile.display_name || profile.username || "Uživatel"} />
    <nav aria-label="Stránkování nálezů" className="flex justify-center gap-6 bg-stone-100 px-5 py-6 text-stone-900 dark:bg-slate-950 dark:text-slate-100">
      {page > 1 && <Link className="underline" href={`/profile/${lowerUsername}?page=${page - 1}`}>Předchozí</Link>}
      {page * size < (findings.count ?? 0) && <Link className="underline" href={`/profile/${lowerUsername}?page=${page + 1}`}>Další</Link>}
    </nav>
  </>;
}
