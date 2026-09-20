// components/FindingCard.tsx
import { CheckCircle2, MapPin, Calendar } from "lucide-react";

export type ConservationStatus =
  | "CR" // Kriticky ohrožený
  | "EN" // Ohrožený
  | "VU" // Zranitelný
  | "NT" // Téměř ohrožený
  | "LC"; // Málo dotčený

export interface ProfileFindingCardProps {
  imageUrl: string;
  imageAlt: string;
  name: string; // český název druhu
  latinName: string; // vědecký název vč. autora, např. "Lucanus cervus (Linnaeus, 1758)"
  family: string; // taxonomický tag, např. "LUCANIDAE"
  findingNumber: number; // pořadové číslo nálezu, např. 284
  gps: string; // souřadnice, např. "50.038° N, 13.882° E"
  note: string; // terénní poznámka
  location: string; // lokalita, např. "CHKO Křivoklátsko"
  dateFound: string; // datum nálezu, např. "14. července 2024"
  authorName: string;
  authorInitials: string;
  conservationStatus?: ConservationStatus;
  conservationLabel?: string; // např. "Kriticky ohrožený"
  verified?: boolean;
  onDetailClick?: () => void;
}

const STATUS_STYLES: Record<ConservationStatus, string> = {
  CR: "bg-red-50 dark:bg-red-950/90 border-red-300/80 dark:border-red-600/70 text-red-800 dark:text-red-300",
  EN: "bg-amber-50 dark:bg-amber-950/90 border-amber-300/80 dark:border-amber-600/70 text-amber-800 dark:text-amber-300",
  VU: "bg-yellow-50 dark:bg-yellow-950/90 border-yellow-300/80 dark:border-yellow-600/70 text-yellow-800 dark:text-yellow-300",
  NT: "bg-lime-50 dark:bg-lime-950/90 border-lime-300/80 dark:border-lime-600/70 text-lime-800 dark:text-lime-300",
  LC: "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300/80 dark:border-emerald-600/70 text-emerald-800 dark:text-emerald-300",
};

const STATUS_DOT: Record<ConservationStatus, string> = {
  CR: "bg-red-400",
  EN: "bg-amber-400",
  VU: "bg-yellow-400",
  NT: "bg-lime-400",
  LC: "bg-emerald-400",
};

export function ProfileFindingCard({
  imageUrl,
  imageAlt,
  name,
  latinName,
  family,
  findingNumber,
  gps,
  note,
  location,
  dateFound,
  authorName,
  authorInitials,
  conservationStatus = "CR",
  conservationLabel = "Kriticky ohrožený",
  verified = true,
  onDetailClick,
}: ProfileFindingCardProps) {
  return (
 <div className="group w-full bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition duration-300 hover:shadow-xl dark:hover:border-slate-700 font-sans text-stone-900 dark:text-slate-100">
      {/* Obrazová část s terénními štítky */}
      <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-slate-900">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />


        {/* Horní odznaky: Verifikace a IUCN status */}
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex flex-wrap items-center justify-between gap-1.5">
          {verified ? (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/85 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 shadow-sm backdrop-blur-md whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              Ověřeno garantem
            </span>
          ) : (
            <span />
          )}
          <span
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm backdrop-blur-md border whitespace-nowrap ${STATUS_STYLES[conservationStatus]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${STATUS_DOT[conservationStatus]}`} />
            {conservationStatus} · {conservationLabel}
          </span>
        </div>

        {/* Spodní štítky na fotce: Číslo nálezu a GPS souřadnice */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-2.5 sm:left-3 sm:right-3 flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 sm:px-2 rounded bg-slate-100/90 dark:bg-slate-900/75 backdrop-blur-sm border border-slate-300/60 dark:border-slate-700/40 whitespace-nowrap">
            Nález #{findingNumber}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 rounded bg-slate-100/90 dark:bg-slate-900/75 backdrop-blur-sm border border-slate-300/60 dark:border-slate-700/40 max-w-full truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            <span className="truncate">GPS: {gps}</span>
          </span>
        </div>
      </div>

      {/* Obsahová / taxonomická část karty */}
      <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 bg-linear-to-b from-white to-stone-50/50 dark:from-slate-950 dark:to-slate-900/50">
        {/* Druhový název a čeleď */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
            <h3 className="min-w-0 break-words text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors cursor-pointer">
              {name}
            </h3>
            <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase px-1.5 py-0.5 sm:px-2 rounded    text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {family}
            </span>
          </div>
          <p className="text-xs italic text-stone-600 dark:text-slate-400 mt-0.5 break-words">{latinName}</p>
        </div>

        {/* Terénní poznámka */}
        <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-300 line-clamp-3">{note}</p>

        {/* Lokalita a datum */}
        <div className="pt-3 border-t border-stone-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 min-w-0">
            <Calendar className="w-4 h-4 text-stone-500 dark:text-slate-500 shrink-0" />
            <span className="truncate">{dateFound}</span>
          </div>
        </div>

        {/* Spodní lišta: Mapovatel & CTA Detail */}
        {/* <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shadow-xs">
              {authorInitials}
            </div>
            <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">{authorName}</span>
          </div>
          <button
            onClick={onDetailClick}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
          >
            Detail nálezu
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div> */}
      </div>
    </div>
  );
}
