"use client";

import { useRef } from "react";
import {
  LayoutGrid,
  ShieldCheck,
  MapIcon,
  Trophy,
  Download,
} from "lucide-react";

const TABS = [
  { key: "nalezy", label: "Moje nálezy", icon: LayoutGrid, count: 284 },
  {
    key: "determinace",
    label: "Moje determinace",
    icon: ShieldCheck,
    count: 1420,
  },
  { key: "lokality", label: "Uložené lokality", icon: MapIcon, count: 36 },
  { key: "odznaky", label: "Získané odznaky", icon: Trophy, count: 18 },
] as const;

export default function FilterBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

const handleTabClick = (key: string) => {
  onTabChange(key);

  const container = scrollRef.current;
  const item = itemRefs.current[key];
  if (!container || !item) return;

  const index = TABS.findIndex((t) => t.key === key);
  const isLast = index === TABS.length - 1;
  const nextItem = TABS[index + 1]
    ? itemRefs.current[TABS[index + 1].key]
    : null;

  const itemLeft = item.offsetLeft;
  const itemRight = itemLeft + item.offsetWidth;
  const visibleLeft = container.scrollLeft;
  const visibleRight = visibleLeft + container.clientWidth;
  const buffer = 16;

  if (isLast) {
    // poslední tlačítko: doscrolluj s malým bufferem, ignoruj pravý padding kontejneru
    const target = itemRight - container.clientWidth + buffer;
    container.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
    return;
  }

  const minNextPeek = 56;
  const nextRight = nextItem
    ? nextItem.offsetLeft + Math.min(nextItem.offsetWidth, minNextPeek)
    : itemRight;

  if (nextRight > visibleRight) {
    container.scrollTo({
      left: nextRight - container.clientWidth,
      behavior: "smooth",
    });
  } else if (itemLeft < visibleLeft) {
    container.scrollTo({
      left: itemLeft - buffer,
      behavior: "smooth",
    });
  }
};

  return (
    <div className="w-full flex flex-col md:flex-row justify-between gap-3">
      <ul
        ref={scrollRef}
        className="flex flex-row flex-nowrap md:flex-wrap gap-2 md:gap-3 overflow-x-auto -mx-5 pl-5 pr-10 md:mx-0 md:px-0 min-w-0 scrollbar-none"
      >
        {TABS.map(({ key, label, icon: Icon, count }) => {
          const isActive = activeTab === key;
          return (
            <li
              key={key}
              ref={(el) => {
                itemRefs.current[key] = el;
              }}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => handleTabClick(key)}
                className={
                  isActive
                    ? "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span
                  className={
                    isActive
                      ? "text-xs font-normal text-slate-500 dark:text-slate-400"
                      : "text-xs font-normal text-slate-400 dark:text-slate-500"
                  }
                >
                  {count.toLocaleString("cs-CZ")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors shrink-0 w-full md:w-auto"
      >
        <Download className="w-4 h-4" />
        Export CSV (NDOP/BioLib)
      </button>
    </div>
  );
}