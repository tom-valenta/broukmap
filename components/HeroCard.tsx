import { LucideIcon } from "lucide-react";

interface HeroCardProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

export default function HeroCard({
  number,
  title,
  description,
  icon: Icon,
  iconColor,
}: HeroCardProps) {
  return (
    <div className="flex flex-col gap-2 md:gap-3 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-7 rounded-xl md:rounded-2xl h-full">
      <div className="flex items-center gap-2 md:gap-3">
        <div
          className={`flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl border ${iconColor}`}
        >
          <Icon className="w-5 h-5 md:w-7 md:h-7" />
        </div>
        <span className="dark:text-white font-bold text-lg md:text-2xl text-stone-900 leading-tight">
          {number}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug break-words">
          {title}
        </p>
        <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug break-words">
          {description}
        </p>
      </div>
    </div>
  );
}