export default function Footer() {
  return (
    <footer className="relative z-20 p-4 pb-28 border-t border-default shadow-sm flex flex-col items-center md:gap-3 md:flex-row md:items-center md:justify-between md:p-6 md:pb-28 lg:pb-6 dark:bg-slate-950 bg-white border-stone-200 text-stone-700 dark:border-slate-800/80 dark:text-slate-400">
      <div className="text-sm text-body text-center flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
        <a href="#" className="font-bold dark:text-white">
          BroukMap
        </a>
        Platforma pro pozorování a poznávání české entomofauny
      </div>
      <ul className="flex flex-wrap items-center justify-center mt-3 text-sm font-medium text-body md:mt-0 gap-4 md:gap-6 text-stone-700 dark:text-slate-400">
        <li>
          <a href="#" className="hover:underline">
            O projektu
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline">
            Podmínky používání
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline">
            Ochrana osobních údajů
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline">
            Cookies
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline">
            Kontakt
          </a>
        </li>
      </ul>
    </footer>
  );
}
