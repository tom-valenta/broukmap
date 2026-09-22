"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { searchUsers, type UserSearchResult } from "./search-action";
import UserAvatar from "@/components/UserAvatar";

export default function UserSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(async () => {
      const users = await searchUsers(query.trim());
      if (cancelled) return;
      setResults(users);
      setOpen(true);
      setLoading(false);
      setActiveIndex(-1);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToProfile(username: string) {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    router.push(`/profile/${username}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeIndex < 0 || activeIndex >= results.length) return;
      e.preventDefault();
      goToProfile(results[activeIndex].username);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full mb-4">
      <div
        className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ring-gray-900/5
        bg-white border-stone-200 dark:bg-slate-900 dark:border-slate-800"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400 dark:text-slate-500" />
        ) : (
          <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Hledat uživatele podle jména..."
          className="w-full bg-transparent text-sm text-stone-700 placeholder:text-slate-400
          focus:outline-none dark:text-white dark:placeholder:text-slate-400"
        />
      </div>

      {open && (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border shadow-xl ring-gray-900/5
          bg-white border-stone-200 dark:bg-slate-900 dark:border-slate-800"
        >
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              Žádný uživatel nenalezen
            </p>
          ) : (
            results.map((user, index) => (
              <button
                key={user.id}
                onClick={() => goToProfile(user.username)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === activeIndex
                    ? "bg-stone-100 dark:bg-slate-800"
                    : "hover:bg-stone-100 dark:hover:bg-slate-800"
                }`}
              >
                <UserAvatar
                  profile={user}
                  size={32}
                  className="h-8 w-8 shrink-0 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-700 dark:text-white">
                    @{user.username}
                  </span>
                  {user.display_name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {user.display_name}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}