// components/ProfileFindingsSection.tsx
"use client";

import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import FindingsFilterRow, { type FindingsView } from "@/components/ProfileFindingBar";
import { ProfileFindingCard, type ProfileFindingCardProps } from "@/components/ProfileFindingCard";

const findings: ProfileFindingCardProps[] = [
  { imageUrl: "/idk.jpg" },
  { imageUrl: "/bug2.jpg" },
  { imageUrl: "/bug.jpg" },
  { imageUrl: "/idk.jpg" },
].map((img) => ({
  ...img,
  imageAlt: "Roháč obecný (Lucanus cervus)",
  name: "Roháč obecný",
  latinName: "Lucanus cervus (Linnaeus, 1758)",
  family: "LUCANIDAE",
  findingNumber: 284,
  gps: "50.038° N, 13.882° E",
  note: "Samčí exemplář (délka těla 74 mm vč. kusadel) nalezen na osluněném kmeni přestárlého dubu zimního v pozdním odpoledni.",
  location: "CHKO Křivoklátsko",
  dateFound: "14. července 2024",
  authorName: "RNDr. Tereza Nováková",
  authorInitials: "TN",
  conservationStatus: "CR" as const,
  conservationLabel: "Kriticky ohrožený",
}));

// grid/list/columns → počet sloupců layoutu
const VIEW_GRID_CLASSES: Record<FindingsView, string> = {
  grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  list: "grid-cols-1",
  columns: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export default function ProfileFindingsSection() {
  const [activeTab, setActiveTab] = useState("nalezy");
  const [view, setView] = useState<FindingsView>("grid");

  return (
    <>
      <section className="py-4 md:py-5 px-5 md:px-10 lg:px-16 bg-stone-100 dark:bg-slate-900 border-stone-300 dark:border-slate-800">
        <div className="w-full flex flex-col md:flex-row max-w-7xl mx-auto justify-between gap-3">
          <FilterBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </section>

      {activeTab === "nalezy" && (
        <section className="py-4 md:py-12 px-5 md:px-10 lg:px-16 bg-stone-100 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <FindingsFilterRow
              view={view}
              onViewChange={setView}
              shown={findings.length}
              total={284}
            />
            <div className={`grid ${VIEW_GRID_CLASSES[view]} gap-4 sm:gap-6 2xl:gap-8`}>
              {findings.map((f, i) => (
                <ProfileFindingCard key={i} {...f} />
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "determinace" && (
        <section className="py-4 md:py-12 px-5 md:px-10 lg:px-16 bg-stone-100 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {/* determinace grid/list, až budeš mít data a kartu pro ně */}
          </div>
        </section>
      )}

      {activeTab === "lokality" && (
        <section className="py-4 md:py-12 px-5 md:px-10 lg:px-16 bg-stone-100 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {/* uložené lokality */}
          </div>
        </section>
      )}

      {activeTab === "odznaky" && (
        <section className="py-4 md:py-12 px-5 md:px-10 lg:px-16 bg-stone-100 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto text-sm text-stone-500 dark:text-slate-400">
            Zatím žádné odznaky k zobrazení.
          </div>
        </section>
      )}
    </>
  );
}