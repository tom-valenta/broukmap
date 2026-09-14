"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Přepnout téma"
      className="relative w-16 h-8 rounded-full border transition-colors duration-300
                 bg-stone-100 border-stone-300
                 dark:bg-slate-800 dark:border-slate-700"
    >
      {/* Posuvný kruh */}
      <span
        className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full shadow-md
                    flex items-center justify-center
                    transition-transform duration-300 ease-in-out
                    bg-white dark:bg-slate-950
                    ${isDark ? "translate-x-8" : "translate-x-0"}`}
      >
        {isDark ? (
          <Moon size={14} className="text-white " />
        ) : (
          <Sun size={14} className="text-slate-900" />
        )}
      </span>
    </button>
  );
}