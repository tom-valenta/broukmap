export default function Footer() {
  return (
    <footer className="relative z-20 p-4 border-t border-default shadow-sm flex flex-col items-center md:gap-3 md:flex-row md:items-center md:justify-between md:p-6 dark:bg-slate-950 bg-white border-stone-200 text-stone-700 dark:border-slate-800/80 dark:text-slate-400">
      <div className="text-sm text-body text-center flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
        <a href="https://flowbite.com/" className="font-bold dark:text-white">
          BroukMap
        </a>
        Platforma pro pozorování a poznávání české entomofauny
      </div>
      <ul className="flex flex-wrap items-center justify-center mt-3 text-sm font-medium text-body md:mt-0">
        <li>
          <a href="#" className="hover:underline me-4 md:me-6">
            About
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline me-4 md:me-6">
            Privacy Policy
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline me-4 md:me-6">
            Licensing
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