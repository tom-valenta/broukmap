import {
  FlaskConical,
  ImagePlus,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Bug,
  BugIcon,
  UserGroup,
  BadgeCheck,
  Shield,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative z-0 px-5 py-12 lg:py-24 overflow-hidden bg-linear-to-b from-[#f6f7f1] via-emerald-50 to-stone-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-130 h-130 rounded-full  bg-emerald-300/30 blur-[120px]" />

      <div className="absolute -top-24 right-0 w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full bg-emerald-400/40  dark:mix-blend-screen blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-15 left-12 w-[min(350px,70vw)] h-[min(350px,70vw)] rounded-full bg-green-300/40 dark:mix-blend-screen blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center lg:items-stretch text-stone-600">
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200 dark:bg-slate-900 dark:border-slate-800 dark:text-emerald-500 font-bold text-sm mb-5 shadow-sm">
            <FlaskConical className="w-4 h-4 " />
            <span>Ve spolupráci s AOPK ČR, NDOP a ČSE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="dark:text-slate-400 text-stone-700 font-semibold">
              Občanská věda 2025
            </span>
          </div>

          {/* headline */}
          <h1 className="text-4xl lg:text-5xl font-bwold dark:text-white text-stone-900 tracking-tight leading-[1.1] mb-4 max-w-2xl">
            Objevujte a mapujte fascinující svět hmyzu v České republice
          </h1>

          {/* subtitle */}
          <p className="text-lg dark:text-gray-300 leading-relaxed mb-8 max-w-xl">
            Zapojte se do největší české občanské vědy zaměřené na brouky a
            entomologii. Foťte nálezy v terénu, získejte pomoc s určením od
            předních odborníků a pomáhejte chránit naši vzácnou biodiverzitu.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-8">
            <button
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2 dark:bg-emerald-500 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold dark:hover:bg-emerald-600  px-6 py-3 rounded-lg  shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <ImagePlus className="w-5 h-5" strokeWidth={3} />
              <span>Přidat první nález</span>
            </button>

            <a
              href="#"
              className="w-full sm:w-auto flex items-center justify-center gap-2  bg-white border-stone-200 text-stone-800 dark:bg-slate-900 border dark:border-slate-800 dark:text-slate-300 font-bold px-6 py-3 rounded-lg  hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Prozkoumat interaktivní mapu</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* trust badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <span className="text-xs uppercase tracking-widest dark:text-slate-400 font-bold">
              Odborní garanti:
            </span>
            <div className="flex items-center gap-2 flex-wrap font-bold text-sm">
              <span className="px-2 py-1 rounded border bg-white border-stone-300 text-stone-800 shadow-sm transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                AOPK ČR
              </span>
              <span className="px-2 py-1 rounded border bg-white border-stone-300 text-stone-800 shadow-sm transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                NDOP Biomonitoring
              </span>
              <span className="px-2 py-1 rounded border bg-white border-stone-300 text-stone-800 shadow-sm transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                Česká společnost entomologická
              </span>
            </div>
          </div>
        </div>

        {/* Right column: image */}
        <div className="lg:col-span-5 relative lg:h-full">
          <div className="relative rounded-xl overflow-hidden shadow-xl aspect-4/3 lg:aspect-auto lg:h-full">
            <img
              src="/idk.jpg"
              alt="Roháč obecný (Lucanus cervus) na kmeni starého dubu porostlém mechem v lužním lese"
              width={1200}
              height={900}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full absolute inset-0 object-cover object-center"
            />

            {/* top-left tag */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white/95 border-stone-200 dark:bg-slate-900/60  dark:border-slate-800 border backdrop-blur-md rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-700  animate-pulse" />
              <span>Nález týdne</span>
            </div>

            {/* top-right badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/95 border-stone-200 dark:bg-slate-900/60 dark:border-slate-800 text-emerald-700 dark:text-emerald-400  border backdrop-blur-md rounded-full text-xs font-bold shadow-md">
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-700"
                strokeWidth={3}
              />
              <span>Ověřeno komunitou</span>
            </div>

            {/* bottom info card */}
            <div className="absolute inset-x-4 bottom-4 p-4 dark:bg-slate-900 dark:border-slate-800 bg-white/95 border-stone-300/80 border backdrop-blur-md rounded-xl shadow-lg flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-stone-900 dark:text-white">
                  Roháč obecný
                </span>
                <span className="text-xs text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/60 px-2 py-0.5 rounded font-bold">
                  Kriticky ohrožený
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-stone-700 dark:text-slate-300">
                <span className="italic">Lucanus cervus (Linnaeus, 1758)</span>
                <span className="flex items-center gap-1 ">
                  <MapPin
                    className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-500"
                    strokeWidth={3}
                  />
                  CHKO Křivoklátsko
                </span>
              </div>
              <div className="mt-1 pt-1.5 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-300">
                <span>Determinoval: RNDr. V. Křivánek, CSc.</span>
                <span>18. června 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl  py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4   py-8 rounded-3xl items-stretch">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-7  rounded-xl md:rounded-2xl h-full">
            <div className="flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <UserGroup className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="dark:text-white font-bold text-lg md:text-2xl text-stone-900 leading-tight">
                1 420
              </span>
              <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug wrap-break-word">
                Zmapovaných nálezů
              </p>
              <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug wrap-break-word">
                z celého území ČR
              </p>
            </div>
          </div>

           <div className="flex items-center gap-2 md:gap-3 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-7  rounded-xl md:rounded-2xl h-full">
            <div className="flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <UserGroup className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="dark:text-white font-bold text-lg md:text-2xl text-stone-900 leading-tight">
                1 420
              </span>
              <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug wrap-break-word">
                Zmapovaných nálezů
              </p>
              <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug wrap-break-word">
                z celého území ČR
              </p>
            </div>
          </div>

           <div className="flex items-center gap-2 md:gap-3 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-7  rounded-xl md:rounded-2xl h-full">
            <div className="flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <UserGroup className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="dark:text-white font-bold text-lg md:text-2xl text-stone-900 leading-tight">
                1 420
              </span>
              <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug wrap-break-word">
                Zmapovaných nálezů
              </p>
              <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug wrap-break-word">
                z celého území ČR
              </p>
            </div>
          </div>

           <div className="flex items-center gap-2 md:gap-3 min-w-0 border bg-white shadow-lg border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-3 md:p-7  rounded-xl md:rounded-2xl h-full">
            <div className="flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <UserGroup className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="dark:text-white font-bold text-lg md:text-2xl text-stone-900 leading-tight">
                1 420
              </span>
              <p className="font-semibold text-stone-700 dark:text-slate-400 text-xs md:text-base leading-snug wrap-break-word">
                Zmapovaných nálezů
              </p>
              <p className="text-stone-500 dark:text-slate-400/90 text-[11px] md:text-sm leading-snug wrap-break-word">
                z celého území ČR
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
