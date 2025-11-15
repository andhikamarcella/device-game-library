"use client";

import { Moon, Sun } from "lucide-react";
import { useThemePreference } from "@/hooks/useThemePreference";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemePreference();
  const nextModeLabel = resolvedTheme === "dark" ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-500/60 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
      aria-label="Toggle theme"
      aria-pressed={resolvedTheme === "dark"}
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{nextModeLabel} mode</span>
    </button>
  );
}
