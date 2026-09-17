export default function PasswordResetConfirmation() {
  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-6 py-12 lg:px-8 dark:text-white bg-linear-to-b from-[#f6f7f1] via-emerald-100 to-stone-50 dark:bg-slate-950 dark:bg-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 dark:bg-green-600/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-emerald-700/10 blur-3xl animate-blob animation-delay-4000" />
      </div>
      
       
       

      <div className="relative bg-white dark:bg-slate-900 mx-auto w-full max-w-md rounded-2xl border dark:border-slate-800 border-stone-200 shadow-xl ring-gray-900/5 p-6 text-center dark:text-slate-300 text-stone-700"> <h1 className="text-2xl font-bold">Heslo úspěšně resetováno</h1> 
      <p className="text-center text-gray-600 dark:text-gray-400">
        Vaše heslo bylo úspěšně resetováno. <a href="/" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">Klikněte zde</a> pro návrat na domovskou stránku.
      </p>
      </div>
    </div>
  );
}