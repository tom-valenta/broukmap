import Hero from "@/components/hero";
import { createClient } from "@/lib/supabase/server";
import { StepCard } from "@/components/layout/StepCard";
import { GradientAnimatedBlobs } from "@/components/Blob";
import { FindingCard } from "@/components/FindingCard";
const findings = [
  {
    imageUrl: "/idk.jpg",
    imageAlt: "Tesařík obrovský na dubové kůře",
    name: "Tesařík obrovský",
    latinName: "Cerambyx cerdo",
    family: "Tesaříkovití",
    location: "Břeclavsko",
    authorName: "Tereza Nováková",
    authorInitials: "TN",
    timeAgo: "dnes",
  },
  {
    imageUrl: "/bug.jpg",
    imageAlt: "Chrobák lesní na lesní podestýlce",
    name: "Chrobák lesní",
    latinName: "Anoplotrupes stercorosus",
    family: "Chrobákovití",
    location: "Krkonoše",
    authorName: "Martin Dvořák",
    authorInitials: "MD",
    timeAgo: "včera",
  },
  {
    imageUrl: "/idk.jpg",
    imageAlt: "Střevlík fialový na mechu",
    name: "Střevlík fialový",
    latinName: "Carabus violaceus",
    family: "Střevlíkovití",
    location: "Šumava",
    authorName: "Petra Kučerová",
    authorInitials: "PK",
    timeAgo: "2 dny",
  },
  {
    imageUrl: "/idk.jpg",
    imageAlt: "Krasec lipový na kmeni stromu",
    name: "Krasec lipový",
    latinName: "Ovalisia rutilans",
    family: "Krascovití",
    location: "Praha - Stromovka",
    authorName: "Jan Sýkora",
    authorInitials: "JS",
    timeAgo: "3 dny",
  },
];

import {
  FlaskConical,
  ImagePlus,
  ArrowRight,
  CheckCircle2,
  MapPin,
  BugIcon,
  Group,
  UserGroup,
  BadgeCheck,
  Shield,
  CameraIcon,
  MapPinPlus,
  Microscope,
  Lightbulb,
  LightbulbIcon,
  CircleUser,
  CircleUserIcon,
  UserPlus,
  Phone,
  Smartphone,
  Database,
  AwardIcon,
  MessagesSquare,
} from "lucide-react";
import { verify } from "crypto";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Hero />

      {/* Jak funguje mapování */}
      <section className="relative overflow-hidden px-5 md:px-10 lg:px-16 dark:bg-slate-900 border-y dark:border-slate-800 bg-stone-100 border-stone-300 ">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-green-300/20 blur-[120px]" />

        <div className="relative max-w-7xl mx-auto  py-12 md:py-20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-10">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold dark:text-emerald-500 text-emerald-700 uppercase tracking-wide">
                Jednoduchý proces
              </p>
              <p className="text-3xl font-bold dark:text-white text-stone-900">
                Jak funguje mapování s BroukMap
              </p>
            </div>

            <p className="md:max-w-sm dark:text-slate-300 text-stone-700">
              Každé jednotlivé pozorování pomáhá sledovat úbytek nebo šíření
              hmyzích populací.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 justify-center">
            <StepCard
              icon={CameraIcon}
               iconColor="dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-100 text-stone-800 border-emerald-300"
              step="01"
              title="1. Vyfoťte hmyz v terénu"
              description="Stačí mobilní telefon nebo fotoaparát při víkendové procházce lesem, loukou nebo přímo na zahradě. Snažte se vyfotit brouka shora i z boku."
              tip="Tip: Vyhněte se přímému blesku"
              tipIcon={LightbulbIcon}
              tipIconColor="dark:text-emerald-400 dark:border-emerald-800 text-stone-800 border-amber-300"
            />

            <StepCard
              icon={MapPinPlus}
              iconColor="dark:bg-lime-950/50 dark:text-lime-400 dark:border-lime-300/30 bg-lime-100 text-stone-800 border-lime-300"
              step="02"
              title="2. Nahrajte s lokalitou"
              description="Aplikace z fotografie automaticky načte GPS souřadnice a čas. Můžete připsat poznámku o biotopu (např. trouchnivějící pařez buku) nebo počasí."
              tip="Předání do centrální databáze NDOP"
              tipIcon={MapPin}
              tipIconColor="dark:text-lime-400 dark:border-lime-300/30 text-stone-800 border-amber-300"
            />

            <StepCard
              icon={Microscope}
              iconColor="dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-300/30 bg-amber-100 text-stone-800 border-amber-300"
              step="03"
              title="3. Vyfoťte hmyz v terénu"
              description="Zkušení determinátoři a akademičtí entomologové určí nebo potvrdí druh. Nález je verifikován a data se stávají oficiálním podkladem ochrany přírody ČR."
              tip="Předání do centrální databáze NDOP"
              tipIcon={BadgeCheck}
              tipIconColor="dark:text-amber-400 dark:border-amber-300/30 text-stone-800 border-amber-300"
            />
          </div>
        </div>
      </section>

      {/* Poslední nálezy */}
      <section className="w-full py-16 px-5 md:px-10 lg:px-16 bg-[#fbfbf7] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-500 font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Terénní puls
              </span>
              <h2 className="text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight mt-1 font-extrabold">
                Nejnovější pozorování komunity
              </h2>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-800 dark:text-emerald-500 hover:text-emerald-950 dark:hover:text-emerald-400 font-bold transition-colors group"
            >
              <span>Zobrazit všech 14 850+ nálezů</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8">
            {findings.map((finding) => (
              <FindingCard key={finding.latinName} {...finding} />
            ))}
          </div>
        </div>
      </section>

      {/* Proč mapovat s námi */}
      <section className="bg-stone-100 px-5 md:px-10 lg:px-16 dark:bg-slate-900 border-y dark:border-slate-800">
        <div className="max-w-7xl mx-auto py-12 md:py-20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-10">
            <div className="flex flex-col gap-2">
              <p className="font-semibold dark:text-emerald-500 text-emerald-600 uppercase tracking-wide">
                Jednoduchý proces
              </p>
              <p className="text-3xl font-bold dark:text-white text-stone-900">
                Jak funguje mapování s BroukMap
              </p>
            </div>

            <p className="md:max-w-md dark:text-slate-300 text-stone-700">
              Každé jednotlivé pozorování pomáhá sledovat úbytek nebo šíření
              hmyzích populací.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 justify-center">
            <StepCard
              icon={Database}
                   iconColor="dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-100 text-stone-800 border-emerald-300"
              step="01"
              title="Skutečný přínos vědě"
              description="Data nejsou uzamčena v komerčních aplikacích. Pravidelně je exportujeme do Nálezové databáze ochrany přírody (NDOP AOPK ČR), kde slouží k vyhlašování chráněných území a záchranným programům."
              tip="Otevřená vědecká data (GBIF standard)"
                tipIconColor="dark:text-emerald-400 dark:border-emerald-800 text-stone-800 "
            />

            <StepCard
              icon={AwardIcon}
                iconColor="dark:bg-lime-950/50 dark:text-lime-400 dark:border-lime-300/30 bg-lime-100 text-stone-800 border-lime-300"
              step="02"
              title="Vlastní digitální sbírka & odznaky"
              description="Budujte si svůj osobní terénní deník bez nutnosti usmrcování hmyzu. Získávejte odznaky za nalezené čeledi, objevujte vzácné druhy ve svém okrese a postupujte v žebříčku mapovatelů."
              tip="Moderní etická entomologie"
              tipIconColor="dark:text-lime-400 dark:border-lime-300/30 text-stone-800 "
            />

            <StepCard
              icon={MessagesSquare}
              iconColor="dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-300/30 bg-amber-100 text-stone-800 border-amber-300"
              step="03"
              title="Živá komunita nadšenců"
              description="Nejste si jistí, zda jde o tesaříka nebo kousavce? Diskutujte přímo u nálezů. Komunita českých entomologů vám ochotně poradí s určovacími znaky a doporučí terénní literaturu."
              tip="Přátelské prostředí pro začátečníky"
              tipIconColor="dark:text-amber-400 dark:border-amber-300/30 text-stone-800"
            />
          </div>
        </div>
      </section>

      <section className=" px-5 md:px-10 lg:px-16 dark:bg-slate-950 bg-white p-5">
        <GradientAnimatedBlobs
          title="Viděli jste dnes zajímavého brouka? Přidejte své pozorování během dvou minut."
          copy="test"
          className=""
        />
      </section>
    </>
  );
}
