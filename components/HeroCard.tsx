import { LucideIcon } from "lucide-react";

interface HeroCardProps {
  number: string;
  title: string;
  description?: string;
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
    <div className="grid grid-cols-[auto_1fr] items-center content-center gap-x-3 gap-y-2 min-[400px]:gap-y-0.5 md:gap-x-4 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-6 rounded-xl md:rounded-2xl h-full">
      <div
        className={`flex items-center justify-center shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl border min-[400px]:row-span-2 ${iconColor}`}
      >
        <Icon className="w-5 h-5 md:w-7 md:h-7" />
      </div>

      <p className="dark:text-white font-bold text-xl md:text-3xl text-stone-900 leading-none">
        {number}
      </p>

      <div className="col-span-2 min-[400px]:col-span-1 min-w-0">
        <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug break-words">
          {title}
        </p>
        {description && (
          <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug break-words">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}