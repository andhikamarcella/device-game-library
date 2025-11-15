"use client";

import { useMemo } from "react";

import { useUserGameLibrary } from "@/hooks/useUserGameLibrary";

export function DashboardStats() {
  const { computeStats } = useUserGameLibrary();
  const stats = useMemo(() => computeStats(), [computeStats]);

  const cards = [
    { label: "Total games", value: stats.totalGames },
    { label: "Playing", value: stats.totalPlaying },
    { label: "Completed", value: stats.totalCompleted },
    { label: "Wishlist", value: stats.totalWishlist },
    { label: "Total hours", value: stats.totalPlaytime },
    {
      label: "Top platform",
      value: stats.mostCommonPlatform ? stats.mostCommonPlatform : "—",
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">Library snapshot</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>
      {stats.topGenres.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Top genres</h3>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            {stats.topGenres.map((genre) => (
              <li key={genre.genre} className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-300">
                {genre.genre} · {genre.count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

