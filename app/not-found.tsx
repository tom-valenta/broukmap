// app/not-found.tsx
export default function NotFound() {
  return (
<section className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none dark:text-white">
      <h1 className="text-6xl font-bold text-emerald-600">404</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        Tahle stránka neexistuje.
      </p>
      
     <a   href="/"
        className="mt-6 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        Zpět na hlavní stránku
      </a>
    </section>
  );
}