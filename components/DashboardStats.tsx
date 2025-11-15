"use client";

import { type UserGame } from "@/hooks/LibraryProvider";

interface DashboardStatsProps {
  games: UserGame[];
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) {
    return "0h";
  }
  if (hours < 100) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours)}h`;
}

export function DashboardStats({ games }: DashboardStatsProps) {
  if (!games.length) {
    return null;
  }

  const totalGames = games.length;
  const completed = games.filter((game) => game.status === "completed").length;
  const playing = games.filter((game) => game.status === "playing").length;
  const wishlist = games.filter((game) => game.ownership === "wishlist").length;
  const totalPlaytime = games.reduce((sum, game) => sum + (game.playtimeHours || 0), 0);

  const platformCounts = new Map<string, number>();
  for (const game of games) {
    for (const platform of game.platforms) {
      const next = (platformCounts.get(platform) ?? 0) + 1;
      platformCounts.set(platform, next);
    }
  }
  const mostCommonPlatform = Array.from(platformCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const statCards = [
    { label: "Total games", value: totalGames },
    { label: "Completed", value: completed },
    { label: "Playing", value: playing },
    { label: "Wishlist", value: wishlist },
    { label: "Total playtime", value: formatHours(totalPlaytime) },
    { label: "Fav platform", value: mostCommonPlatform },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:border-emerald-400/70 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
