import Hero from "@/components/hero";
import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";
export default async function HomePage() {
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (



    
    <>

    <div>
      <p style={{ padding: 20, background: user ? "lightgreen" : "salmon" }}>
        {user ? `Přihlášen jako: ${user.email}` : "Nepřihlášen"}
      </p>
    </div>

      <Hero />
      <div className="px-10 py-3 w-full">
        <div className="flex flex-row bg-gray-100 dark:bg-gray-900 gap-60 mx-auto items-center justify-center h-[10vh] px-10 rounded-3xl grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col">
            <h1 className="flex items-center gap-2  dark:text-white font-bold text-3xl">
              <BugIcon className="w-6 h-6" />
              14 850+
            </h1>
            <p className="font-semibold">Zmapovaných nálezů</p>
            <p>z celého území ČR</p>
          </div>

          <div className="flex flex-col">
            <h1 className="flex items-center gap-2  dark:text-white font-bold text-3xl">
              <UserGroup className="w-6 h-6" />
              14 850+
            </h1>
            <p className="font-semibold">Zmapovaných nálezů</p>
            <p>z celého území ČR</p>
          </div>

          <div className="flex flex-col">
            <h1 className="flex items-center gap-2  dark:text-white font-bold text-3xl">
              <BadgeCheck className="w-6 h-6" />
              14 850+
            </h1>
            <p className="font-semibold">Zmapovaných nálezů</p>
            <p>z celého území ČR</p>
          </div>

          <div className="flex flex-col">
            <h1 className="flex items-center gap-2  dark:text-white font-bold text-3xl">
              <Shield className="w-6 h-6" />
              14 850+
            </h1>
            <p className="font-semibold"> Zmapovaných nálezů</p>
            <p>z celého území ČR</p>
          </div>
        </div>
      </div>


      <section className="w-full bg-gray-900 flex flex-row gap-6 mx-auto justify-center items-center py-20 ">

<a href="#" className="bg-neutral-primary-soft block max-w-sm p-10 border border-default rounded-2xl shadow-xs hover:bg-neutral-secondary-medium ">
    <h5 className="mb-3 text-2xl font-semibold tracking-tight text-heading leading-8">Noteworthy technology acquisitions 2021</h5>
    <p className="text-body">Here are the biggest technology acquisitions of 2025 so far, in reverse chronological order.</p>
</a>

<a href="#" className="bg-neutral-primary-soft block max-w-sm p-10  border border-default rounded-2xl  shadow-xs hover:bg-neutral-secondary-medium">
    <h5 className="mb-3 text-2xl font-semibold tracking-tight text-heading leading-8">Noteworthy technology acquisitions 2021</h5>
    <p className="text-body">Here are the biggest technology acquisitions of 2025 so far, in reverse chronological order.</p>
</a>
<a href="#" className="bg-neutral-primary-soft block max-w-sm p-10 border border-default rounded-2xl  shadow-xs hover:bg-neutral-secondary-medium">
    <h5 className="mb-3 text-2xl font-semibold tracking-tight text-heading leading-8">Noteworthy technology acquisitions 2021</h5>
    <p className="text-body">Here are the biggest technology acquisitions of 2025 so far, in reverse chronological order.</p>
</a>


  
</section>
    </>




  );
}
