"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGameStore } from "@/hooks/useGameStore";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/games": "Games Library",
  "/devices": "Devices",
  "/settings": "Settings",
};

export function LayoutTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const title = useMemo(() => {
    if (pathname.startsWith("/games/") && pathname !== "/games") {
      return "Game Details";
    }
    return pageTitles[pathname] ?? "Device & Game Library";
  }, [pathname]);
  const showSearch = pathname === "/games";

  const { filters, setSearchTerm } = useGameStore();
  const [searchValue, setSearchValue] = useState(filters.searchTerm);

  useEffect(() => {
    setSearchValue(filters.searchTerm);
  }, [filters.searchTerm]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full flex-none items-center gap-3 border-b border-slate-200/80 bg-white/70 px-4 text-slate-900 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:border-emerald-500/60 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">DG Tracker</p>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        </div>
        {showSearch ? (
          <div className="relative ml-auto w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={searchValue}
              onChange={(event) => {
                const value = event.target.value;
                setSearchValue(value);
                setSearchTerm(value);
              }}
              placeholder="Search games by title or tags..."
              className="w-full rounded-xl border border-slate-200 bg-white/90 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        ) : null}
      </div>
      <ThemeToggle />
    </header>
  );
}
