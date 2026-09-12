import Hero from "@/components/hero";
import { createClient } from "@/lib/supabase/server";
import { StepCard } from "@/components/layout/StepCard";
import { GradientAnimatedBlobs } from "@/components/Blob";
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

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Hero />

      {/* Jak funguje mapování */}
      <section className=" dark:bg-slate-900 border-y dark:border-slate-800 bg-stone-100 border-stone-200 ">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-12 md:py-20">
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
              iconColor=""
              step="01"
              title="1. Vyfoťte hmyz v terénu"
              description="Stačí mobilní telefon nebo fotoaparát při víkendové procházce lesem, loukou nebo přímo na zahradě. Snažte se vyfotit brouka shora i z boku."
              tip="Tip: Vyhněte se přímému blesku"
              tipIcon={LightbulbIcon}
            />

            <StepCard
              icon={MapPinPlus}
              iconColor=""
              step="02"
              title="2. Nahrajte s lokalitou"
              description="Aplikace z fotografie automaticky načte GPS souřadnice a čas. Můžete připsat poznámku o biotopu (např. trouchnivějící pařez buku) nebo počasí."
              tip="Tip: Vyhněte se přímému blesku"
              tipIcon={LightbulbIcon}
            />

            <StepCard
              icon={Microscope}
              iconColor=""
              step="03"
              title="3. Vyfoťte hmyz v terénu"
              description="Zkušení determinátoři a akademičtí entomologové určí nebo potvrdí druh. Nález je verifikován a data se stávají oficiálním podkladem ochrany přírody ČR."
              tip="Tip: Vyhněte se přímému blesku"
              tipIcon={LightbulbIcon}
            />
          </div>
        </div>
      </section>

      {/* Poslední nálezy */}
      <section className=" dark:bg-slate-950 dark:border-slate-800 bg-stone-50 border-stone-200 border-y">
        <div className="mx-auto max-w-7xl px-5 md:px-10 lg:px-16 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 pb-10 max-lg:text-center">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold dark:text-emerald-500 text-emerald-600 uppercase tracking-wide">
                Komunita
              </p>
              <p className="text-3xl font-bold dark:text-white text-stone-900">
                Poslední zmapované nálezy
              </p>
            </div>

            <p className="lg:max-w-sm dark:text-white text-stone-700">
              Podívejte se, co naši mapovatelé zaznamenali v posledních dnech.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 g p-5 gap-4">
            <div className=" dark:bg-slate-900/40 border-2 dark:border-slate-800  bg-white shadow-md  border-stone-200  rounded-2xl overflow-hidden flex flex-col">
              <img src="idk.jpg" alt="" className="" />
              <div className="flex flex-col gap-2 p-4">
                <p className="font-bold dark:text-slate-400 text-stone-900">
                  Tesařík Obrovský
                </p>
                <i className="text-stone-500 ">Lasius niger</i>
                <div className="flex flex-row items-center gap-2">
                  <CircleUserIcon className="w-5 h-5 text-emerald-600" />
                  <div className="flex flex-row justify-between flex-1">
                    <p className="dark:text-slate-300 text-stone-800">
                      Tereza Novotná
                    </p>
                    <p className="text-stone-800 dark:text-white font-bold">Dnes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className=" dark:bg-slate-900/40 border-2 dark:border-slate-800  bg-white shadow-md  border-stone-200  rounded-2xl overflow-hidden flex flex-col">
              <img src="idk.jpg" alt="" className="" />
              <div className="flex flex-col gap-2 p-4">
                <p className="font-bold dark:text-slate-400 text-stone-900">
                  Tesařík Obrovský
                </p>
                <i className="text-stone-500 ">Lasius niger</i>
                <div className="flex flex-row items-center gap-2">
                  <CircleUserIcon className="w-5 h-5 text-emerald-600" />
                  <div className="flex flex-row justify-between flex-1">
                    <p className="dark:text-slate-300 text-stone-800">
                      Tereza Novotná
                    </p>
                    <p className="text-stone-800 dark:text-white font-bold">Dnes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className=" dark:bg-slate-900/40 border-2 dark:border-slate-800  bg-white shadow-md  border-stone-200  rounded-2xl overflow-hidden flex flex-col">
              <img src="idk.jpg" alt="" className="" />
              <div className="flex flex-col gap-2 p-4">
                <p className="font-bold dark:text-slate-400 text-stone-900">
                  Tesařík Obrovský
                </p>
                <i className="text-stone-500 ">Lasius niger</i>
                <div className="flex flex-row items-center gap-2">
                  <CircleUserIcon className="w-5 h-5 text-emerald-600" />
                  <div className="flex flex-row justify-between flex-1">
                    <p className="dark:text-slate-300 text-stone-800">
                      Tereza Novotná
                    </p>
                    <p className="text-stone-800 dark:text-white font-bold">Dnes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className=" dark:bg-slate-900/40 border-2 dark:border-slate-800  bg-white shadow-md  border-stone-200  rounded-2xl overflow-hidden flex flex-col">
              <img src="idk.jpg" alt="" className="" />
              <div className="flex flex-col gap-2 p-4">
                <p className="font-bold dark:text-slate-400 text-stone-900">
                  Tesařík Obrovský
                </p>
                <i className="text-stone-500 ">Lasius niger</i>
                <div className="flex flex-row items-center gap-2">
                  <CircleUserIcon className="w-5 h-5 text-emerald-600" />
                  <div className="flex flex-row justify-between flex-1">
                    <p className="dark:text-slate-300 text-stone-800">
                      Tereza Novotná
                    </p>
                    <p className="text-stone-800 dark:text-white font-bold">Dnes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proč mapovat s námi */}
      <section className="bg-stone-50 dark:bg-slate-900 border-y dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-12 md:py-20">
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
              iconColor="dark:bg-gray-900 dark:text-green-500"
              step="01"
              title="Skutečný přínos vědě"
              description="Data nejsou uzamčena v komerčních aplikacích. Pravidelně je exportujeme do Nálezové databáze ochrany přírody (NDOP AOPK ČR), kde slouží k vyhlašování chráněných území a záchranným programům."
              tip="Otevřená vědecká data (GBIF standard)"
            />

            <StepCard
              icon={AwardIcon}
              iconColor=""
              step="02"
              title="Vlastní digitální sbírka & odznaky"
              description="Budujte si svůj osobní terénní deník bez nutnosti usmrcování hmyzu. Získávejte odznaky za nalezené čeledi, objevujte vzácné druhy ve svém okrese a postupujte v žebříčku mapovatelů."
              tip="Moderní etická entomologie"
            />

            <StepCard
              icon={MessagesSquare}
              iconColor=""
              step="03"
              title="Živá komunita nadšenců"
              description="Nejste si jistí, zda jde o tesaříka nebo kousavce? Diskutujte přímo u nálezů. Komunita českých entomologů vám ochotně poradí s určovacími znaky a doporučí terénní literaturu."
              tip="Přátelské prostředí pro začátečníky"
            />
          </div>
        </div>
      </section>

      <section className=" dark:bg-slate-950 bg-white p-5">
        <GradientAnimatedBlobs
          title="Viděli jste dnes zajímavého brouka? Přidejte své pozorování během dvou minut."
          copy="test"
          className=""
        />
      </section>
    </>
  );
}
