"use client";
import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import { ProfileFindingCard } from "@/components/ProfileFindingCard";
import type { Sighting } from "@/lib/sightings";
export default function ProfileFindingsSection({ sightings, badges, authorName }: { sightings: Sighting[]; badges: { id: string; label: string }[]; authorName: string }) {
  const [activeTab, setActiveTab] = useState("nalezy");
  return <section className="bg-stone-100 px-5 py-8 text-stone-900 dark:bg-slate-950 dark:text-slate-100"><div className="mx-auto max-w-7xl space-y-6">
    <FilterBar activeTab={activeTab} onTabChange={setActiveTab} />
    {activeTab === "nalezy" && (sightings.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sightings.map(s => <ProfileFindingCard key={s.id} sighting={s} authorName={authorName} />)}</div> : <p>Zatím žádné dostupné nálezy.</p>)}
    {activeTab === "odznaky" && (badges.length ? <ul className="flex flex-wrap gap-3">{badges.map(b => <li key={b.id} className="rounded-full border border-emerald-300 px-4 py-2">{b.label}</li>)}</ul> : <p>Zatím žádné odznaky.</p>)}
    {activeTab === "nalezy" && sightings.length > 0 && <p className="text-xs text-stone-500 dark:text-slate-400">Lokality: © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. U rozmazaných nálezů je obec přibližná.</p>}
    {activeTab !== "nalezy" && activeTab !== "odznaky" && <p>Tato část profilu zatím není dostupná.</p>}
  </div></section>;
}
