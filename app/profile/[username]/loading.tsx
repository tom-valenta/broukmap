function FindingCardSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="aspect-video animate-pulse bg-stone-200 dark:bg-slate-800" />
    <div className="space-y-3 p-4">
      <div className="h-6 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100 dark:bg-slate-800/70" />
      <div className="h-4 w-full animate-pulse rounded bg-stone-100 dark:bg-slate-800/70" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100 dark:bg-slate-800/70" />
    </div>
  </div>;
}

export default function LoadingProfile() {
  return <>
    <section className="bg-linear-to-b from-[#f6f7f1] via-emerald-50 to-stone-50 px-5 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-white/80 dark:bg-slate-800" />
        <div className="h-36 animate-pulse rounded-3xl bg-white/80 dark:bg-slate-800" />
      </div>
    </section>
    <section className="bg-stone-100 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-stone-200 dark:bg-slate-800" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <FindingCardSkeleton key={index} />)}
        </div>
      </div>
    </section>
  </>;
}
