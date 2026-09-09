import { FlaskConical, ImagePlus, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
export default function Hero () {
return(

<section className="relative w-full px-6 py-12 lg:py-24 overflow-hidden dark:bg-gray-800  ">
      {/* subtle organic background glow */}
      <div className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-12 w-[350px] h-[350px] rounded-full bg-amber-100/40 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-green-800 text-sm mb-5 shadow-sm">
            <FlaskConical className="w-4 h-4 text-green-700" />
            <span>Ve spolupráci s AOPK ČR, NDOP a ČSE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-700" />
            <span className="text-gray-500 font-medium">Občanská věda 2025</span>
          </div>

          {/* headline */}
          <h1 className="text-4xl lg:text-5xl font-bwold dark:text-white tracking-tight leading-[1.1] mb-4 max-w-2xl">
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <ImagePlus className="w-5 h-5" />
              <span>Přidat první nález</span>
            </button>
            
            <a  href="#"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              <span>Prozkoumat interaktivní mapu</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* trust badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <span className="text-xs uppercase tracking-widest dark:text-gray-400">
              Odborní garanti:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-gray-600 text-sm">
              <span className="px-2 py-1 rounded bg-gray-100">AOPK ČR</span>
              <span className="px-2 py-1 rounded bg-gray-100">NDOP Biomonitoring</span>
              <span className="px-2 py-1 rounded bg-gray-100">Česká společnost entomologická</span>
            </div>
          </div>
        </div>

        {/* Right column: image */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-xl">
            <img
              src="/idk.jpg"
              alt="Roháč obecný (Lucanus cervus) na kmeni starého dubu porostlém mechem v lužním lese"
              className="w-full h-[440px] object-cover object-center"
            />

            {/* top-left tag */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-green-900 text-xs font-medium shadow-md">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              <span>Nález týdne</span>
            </div>

            {/* top-right badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-green-900 text-xs font-medium shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Ověřeno garantem</span>
            </div>

            {/* bottom info card */}
            <div className="absolute inset-x-4 bottom-4 p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Roháč obecný</span>
                <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">
                  Kriticky ohrožený
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="italic">Lucanus cervus (Linnaeus, 1758)</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  CHKO Křivoklátsko
                </span>
              </div>
              <div className="mt-1 pt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                <span>Determinoval: RNDr. V. Křivánek, CSc.</span>
                <span>18. června 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    );
    }