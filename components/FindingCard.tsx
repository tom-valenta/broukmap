// components/FindingCard.tsx
import { CheckCircle2, MapPin } from "lucide-react";

interface FindingCardProps {
  imageUrl: string;
  imageAlt: string;
  name: string;
  latinName: string;
  family: string; // taxonomický tag, např. "Tesaříkovití"
  location: string;
  authorName: string;
  authorInitials: string;
  timeAgo: string; // "dnes", "včera", "2 dny"
  verified?: boolean;
}

export function FindingCard({
  imageUrl,
  imageAlt,
  name,
  latinName,
  family,
  location,
  authorName,
  authorInitials,
  timeAgo,
  verified = true,
}: FindingCardProps) {
  return (
    <div className="group flex flex-col bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-emerald-200/70 dark:border-slate-800 shadow-sm hover:shadow-xl    transition-all duration-300">
      {/* Obrázek */}
      <div className="relative h-45  overflow-hidden bg-stone-100 dark:bg-slate-900">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {verified && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-emerald-900/80 backdrop-blur-md text-emerald-100 border border-emerald-400/40 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ověřeno</span>
          </div>
        )}

        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 bg-stone-900/85 backdrop-blur-sm text-stone-100 rounded-lg text-[11px] font-medium shadow-sm flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{location}</span>
        </div>
      </div>

      {/* Obsah */}
      <div className="p-4 flex flex-col flex-1 bg-linear-to-b from-white to-stone-50/50 dark:from-slate-950 dark:to-slate-900/50">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className="text-[17px] text-stone-900 dark:text-white tracking-tight font-extrabold group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">
            {name}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold whitespace-nowrap">
            {family}
          </span>
        </div>

        <span className="text-[13px] text-stone-600 dark:text-slate-400 italic mb-3 font-medium">
          {latinName}
        </span>

        <div className="mt-auto pt-3 border-t border-stone-200/70 dark:border-slate-800 flex items-center justify-between text-stone-600 dark:text-slate-400 text-[12px]">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800/60 flex items-center justify-center font-bold text-[10px] shadow-xs">
              {authorInitials}
            </span>
            <span className="text-stone-800 dark:text-slate-200 font-bold">
              {authorName}
            </span>
          </div>
          <span className="text-stone-500 dark:text-slate-500 font-medium">
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}