"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2, Search, Star } from "lucide-react";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { formatDateTime } from "@/lib/utils";
import { GameStatus } from "@/lib/types";

type SearchResult = {
  id: number;
  name: string;
  coverImage: string | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: string[];
};

const statusLabels: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

export default function DashboardPage() {
  const { devices } = useDeviceStore();
  const { games } = useGameStore();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    fetch(`/api/games/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Unable to search games.");
        }
        return response.json() as Promise<SearchResult[]>;
      })
      .then((data) => {
        setResults(data);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error searching games.");
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDebouncedQuery(query.trim());
  };

  const statusCounts = statusLabels.map((status) => ({
    status,
    count: games.filter((game) => game.status === status).length,
  }));

  const totalGames = games.length || 1;
  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const playingGames = games.filter((game) => game.status === "playing");
  const wishlistGames = games.filter((game) => game.wishlist);

  return (
    <div className="space-y-6">
      <Card
        title="Discover games"
        description="Search the RAWG database to explore new titles and enrich your collection."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a game title..."
              className="w-full rounded-xl border border-slate-200 bg-white/95 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-200 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </button>
        </form>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching RAWG...
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          {!loading && !error && hasSearched && results.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No games matched your search. Try a different title.</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/80 text-slate-900 shadow-md shadow-slate-900/10 transition-transform duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  {game.coverImage ? (
                    <img
                      src={game.coverImage}
                      alt={`${game.name} cover`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-slate-500">
                      No image
                    </div>
                  )}
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-amber-600 shadow-sm dark:bg-slate-950/80 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{game.rating?.toFixed(1) ?? "—"}</span>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{game.releaseYear ?? "Unknown year"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-600 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100 dark:text-emerald-300" />
                  </div>
                  {game.platforms.length ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{game.platforms.join(", ")}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Platforms unknown</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card title="Devices" description="Tracked consoles & devices">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{devices.length}</p>
        </Card>
        <Card title="Games" description="Total items in your library">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{games.length}</p>
        </Card>
        <Card title="Wishlist" description="Games you want to add soon">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{wishlistGames.length}</p>
        </Card>
        <Card title="Playing" description="Currently active playthroughs">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{playingGames.length}</p>
        </Card>
        <Card title="Completed" description="Finished games">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {statusCounts.find((item) => item.status === "completed")?.count ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Games by status"
          description="Quick overview of your backlog progress"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {statusCounts.map((item) => {
              const percentage = Math.round((item.count / totalGames) * 100);
              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span className="capitalize">{item.status}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/80"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Currently playing" description="Stay focused on your active titles">
          <div className="space-y-4">
            {playingGames.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No games are marked as playing right now.</p>
            ) : (
              playingGames.map((game) => (
                <div
                  key={game.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{game.platformName}</p>
                    </div>
                    <StatusBadge status={game.status} />
                  </div>
                  {game.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {game.tags.slice(0, 4).map((tag) => (
                        <TagPill key={tag} label={tag} />
                      ))}
                    </div>
                  ) : null}
                  {game.lastPlayedAt ? (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last played {formatDateTime(game.lastPlayedAt)}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recently added" description="Latest games added to your collection">
          <div className="space-y-3">
            {recentGames.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No games added yet.</p>
            ) : (
              recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{game.platformName}</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(game.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Favorite platforms" description="Devices with the largest libraries">
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Add your first device to begin tracking.</p>
            ) : (
              devices
                .map((device) => ({
                  device,
                  count: games.filter((game) => game.platformId === device.id).length,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map(({ device, count }) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{device.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{device.type}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{count}</span>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
