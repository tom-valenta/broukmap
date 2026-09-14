import { BugIcon, Smartphone, UserPlus } from "lucide-react";

interface GradientAnimatedBlobsProps {
  title: string;
  copy: string;
  className?: string;
}

export function GradientAnimatedBlobs({
  title,
  copy,
  className = "",
}: GradientAnimatedBlobsProps) {
  return (
    <section
      className={`relative isolate border-emerald-900 max-w-7xl mx-auto   border overflow-hidden rounded-2xl bg-emerald-950 dark:bg-slate-900 ${className}`}
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-16 -left-16 w-40 h-40 sm:-top-32 sm:-left-32 sm:w-72 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 sm:-bottom-40 sm:-right-40 sm:w-96 sm:h-128 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/2 -top-10 w-40 h-40 sm:-top-20 sm:w-64 sm:h-64 lg:w-104 lg:h-104 bg-emerald-800/25 rounded-full blur-3xl pointer-events-none" />
        <BugIcon className="absolute right-8 top-45 -translate-y-1/2 dark:text-slate-600/93 text-slate-600/93 w-44 h-44 (or text-emerald-950/40)" />
      </div>

      <div className="p-6 sm:p-6 flex flex-col gap-4 sm:gap-7 max-w-6xl">
        <p className="dark:text-emerald-500 text-emerald-600 font-bold text-sm sm:text-base">
          Zapojte se ještě dnes
        </p>
        <p className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight">
          {title}
        </p>

        <p className="text-sm sm:text-base">
          I obyčejný chrobák na polní cestě má pro mapování biodiverzity význam.
          Pomozte nám tvořit nejucelenější entomologický atlas České republiky.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 sm:mt-3">
          <a
            href="/register"
            className="flex items-center justify-center gap-1 sm:gap-2 bg-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 font-bold py-2 sm:py-3 px-0 sm:px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-5 h-5 dark:text-slate-900 text-emerald-800" strokeWidth={3} />
            <span className="dark:text-slate-900 text-emerald-950">Zaregistrovat se zdarma</span>
          </a>

          <a
            href=""
            className="flex items-center justify-center gap-1 sm:gap-2 text-white bg-emerald-800 hover:bg-emerald-700  dark:bg-slate-800/60 dark:hover:bg-slate-600 dark:text-text-slate-200 font-bold py-2 sm:py-3 px-0 sm:px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Smartphone className="w-5 h-5" strokeWidth={3} />
            <span>Stáhnout mobilní aplikaci</span>
          </a>
        </div>
      </div>
    </section>
  );
}
