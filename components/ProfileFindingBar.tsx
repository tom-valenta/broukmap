// FindingsFilterRow.tsx
"use client";

import { Search, LayoutGrid, List, Columns3, ChevronDown } from "lucide-react";

export type FindingsView = "grid" | "list" | "columns";

export default function FindingsFilterRow({
  view,
  onViewChange,
  shown,
  total,
}: {
  view: FindingsView;
  onViewChange: (v: FindingsView) => void;
  shown: number;
  total: number;
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
      <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Hledat druh, čeleď či lokalitu..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="flex flex-row gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none min-w-0">
          <select
            className="w-full appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 truncate"
            defaultValue="2024"
          >
            <option value="2024">Sezóna 2024</option>
            <option value="2023">Sezóna 2023</option>
            <option value="2022">Sezóna 2022</option>
            <option value="all">Všechny sezóny</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="relative flex-1 sm:flex-none min-w-0">
          <select
            className="w-full appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 truncate"
            defaultValue="verified"
          >
            <option value="verified">Pouze vědecky ověřené</option>
            <option value="all">Všechny nálezy</option>
            <option value="unverified">Neověřené</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="flex flex-row items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        <span className="text-sm text-slate-400 dark:text-slate-500 whitespace-nowrap">
          Zobrazeno {shown} z {total}
        </span>
        <div className="flex flex-row items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:bg-slate-800 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${view === "grid" ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${view === "list" ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("columns")}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${view === "columns" ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
          >
            <Columns3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}