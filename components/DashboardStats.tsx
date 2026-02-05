"use client";

import Link from "next/link";
import { Calendar, Clock, Gamepad2, Heart, NotebookPen, Sparkles, Trophy } from "lucide-react";
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
  if (hours < 1000) {
    return `${Math.round(hours)}h`;
  }
  return `${(hours / 1000).toFixed(1)}kh`;
}

function formatDate(iso?: string | null): string {
  if (!iso) {
    return "Not yet";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardStats({ games }: DashboardStatsProps) {
  if (!games.length) {
    return null;
  }

  const totalGames = games.length;
  const completed = games.filter((game) => game.status === "completed").length;
  const playingGames = games.filter((game) => game.status === "playing");
  const playing = playingGames.length;
  const wishlist = games.filter((game) => game.ownership === "wishlist").length;
  const backlog = games.filter((game) => game.status === "not_started").length;
  const beaten = games.filter((game) => game.status === "beaten").length;
  const dropped = games.filter((game) => game.status === "dropped").length;
  const totalPlaytime = games.reduce((sum, game) => sum + (game.playtimeHours || 0), 0);

  const platformCounts = new Map<string, number>();
  for (const game of games) {
    for (const platform of game.platforms) {
      const next = (platformCounts.get(platform) ?? 0) + 1;
      platformCounts.set(platform, next);
    }
  }
  const favouritePlatforms = Array.from(platformCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const lastAdded = recentGames[0];
  const currentlyPlaying = playingGames
    .slice()
    .sort((a, b) => {
      const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : new Date(a.updatedAt).getTime();
      const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    })[0];

  const statusBreakdown: Array<{
    key: string;
    label: string;
    count: number;
    accent: string;
    helper?: string;
  }> = [
    { key: "backlog", label: "Backlog", count: backlog, accent: "bg-slate-400", helper: "Not started" },
    { key: "playing", label: "Playing", count: playing, accent: "bg-emerald-500" },
    { key: "beaten", label: "Beaten", count: beaten, accent: "bg-sky-500" },
    { key: "completed", label: "Completed", count: completed, accent: "bg-violet-500" },
    { key: "dropped", label: "Dropped", count: dropped, accent: "bg-rose-500" },
  ];

  const statCards = [
    { label: "Tracked games", value: totalGames.toString(), icon: Gamepad2 },
    { label: "Currently playing", value: playing.toString(), icon: Sparkles },
    { label: "Wishlist", value: wishlist.toString(), icon: NotebookPen },
    { label: "Total playtime", value: formatHours(totalPlaytime), icon: Clock },
  ];

  const mostPlayedGames = [...games]
    .filter((game) => game.playtimeHours > 0)
    .sort((a, b) => b.playtimeHours - a.playtimeHours)
    .slice(0, 3);

  const wishlistHighlights = [...games]
    .filter((game) => game.ownership === "wishlist")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:border-emerald-400/70 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Games by status</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Backlog overview</h3>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{totalGames} total</span>
          </header>
          <div className="mt-4 space-y-4">
            {statusBreakdown.map((status) => {
              const percent = totalGames ? Math.round((status.count / totalGames) * 100) : 0;
              return (
                <div key={status.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${status.accent}`} />
                      {status.label}
                      {status.helper ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {status.helper}
                        </span>
                      ) : null}
                    </span>
                    <span>
                      {status.count} • {percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full ${status.accent}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Currently playing</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentlyPlaying ? currentlyPlaying.title : "No active playthrough"}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                {playing ? `${playing} titles` : "Idle"}
              </span>
            </div>
            {currentlyPlaying ? (
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" /> {formatHours(currentlyPlaying.playtimeHours)} logged
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" /> Last played {formatDate(currentlyPlaying.lastPlayedAt ?? currentlyPlaying.updatedAt)}
                </p>
                {currentlyPlaying.notes ? (
                  <p className="rounded-lg border border-slate-200 bg-white/70 p-3 text-xs italic text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                    “{currentlyPlaying.notes.slice(0, 160)}{currentlyPlaying.notes.length > 160 ? "…" : ""}”
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No notes yet. Keep track of your progress from the game page.</p>
                )}
                <Link
                  href={`/games/${currentlyPlaying.igdbId}`}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Continue playing
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Mark a game as “Playing” to see it spotlighted here.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last added</p>
            {lastAdded ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold uppercase text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                  {getInitials(lastAdded.title)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lastAdded.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Added {formatDate(lastAdded.createdAt)}</p>
                </div>
                <Link
                  href={`/games/${lastAdded.igdbId}`}
                  className="rounded-full border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 transition hover:border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-200"
                >
                  View
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Add games to populate your highlights.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recently added</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fresh entries</h3>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Top {recentGames.length}</span>
          </header>
          <ul className="mt-4 space-y-3">
            {recentGames.map((game) => {
              const statusLabel = game.status.replace(/_/g, " ");
              return (
              <li key={game.igdbId} className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-emerald-400/60 hover:bg-emerald-500/5 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10">
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Added {formatDate(game.createdAt)}</span>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <span className="block font-semibold uppercase tracking-wide">{statusLabel}</span>
                  <span>{formatHours(game.playtimeHours)}</span>
                </div>
              </li>
            );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Favorite platforms</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Where you play</h3>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{favouritePlatforms.length || "None"}</span>
          </header>
          {favouritePlatforms.length ? (
            <ul className="mt-4 space-y-3">
              {favouritePlatforms.map(([platform, count]) => (
                <li key={platform} className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-emerald-400/60 hover:bg-emerald-500/5 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {platform.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{platform}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{count} game{count === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{Math.round((count / totalGames) * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Add platform info to your games to build this list.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Most played
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Playtime leaders</h3>
            </div>
            <Trophy className="h-5 w-5 text-emerald-500" />
          </header>
          {mostPlayedGames.length ? (
            <ul className="mt-4 space-y-3">
              {mostPlayedGames.map((game) => (
                <li
                  key={game.igdbId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-emerald-400/60 hover:bg-emerald-500/5 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Last played {formatDate(game.lastPlayedAt ?? game.updatedAt)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {formatHours(game.playtimeHours)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Log some playtime to surface your top games.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Wishlist spotlight
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ready to try next</h3>
            </div>
            <Heart className="h-5 w-5 text-rose-500" />
          </header>
          {wishlistHighlights.length ? (
            <ul className="mt-4 space-y-3">
              {wishlistHighlights.map((game) => (
                <li
                  key={game.igdbId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-emerald-400/60 hover:bg-emerald-500/5 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Added {formatDate(game.createdAt)}</span>
                  </div>
                  <Link
                    href={`/games/${game.igdbId}`}
                    className="text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Add wishlist games to build your next-up list.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
