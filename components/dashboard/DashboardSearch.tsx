"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Loader2, Plus, Star } from "lucide-react";

import { useUserGameLibrary } from "@/hooks/useUserGameLibrary";
import type { Ownership, PlayStatus, UserGameEntry } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res)));

const ownershipOptions: Ownership[] = [
  "none",
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusOptions: PlayStatus[] = ["not_started", "playing", "beaten", "completed", "dropped"];

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

type SearchResult = {
  id: number;
  slug: string;
  name: string;
  coverImage: string | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  playtime: number | null;
  metacritic: number | null;
  platforms: { id: number; name: string; slug: string }[];
  genres: string[];
  source: "rawg" | "tgdb";
};

type SearchResponse = {
  results: SearchResult[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type PlatformOption = { id: number; name: string; slug: string };

export function DashboardSearch() {
  const { games, addOrUpdateGame, updateGame } = useUserGameLibrary();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [platform, setPlatform] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetcher("/api/platforms")
      .then((data: PlatformOption[]) => {
        const sorted = [...data].sort((a, b) => collator.compare(a.name, b.name));
        setPlatforms(sorted);
      })
      .catch(() => setPlatforms([]));
  }, []);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const shouldSearch = Boolean(debouncedQuery || platform);
  const { data, error, isLoading } = useSWR<SearchResponse>(
    shouldSearch ? `/api/games/search?q=${encodeURIComponent(debouncedQuery)}&platform=${platform}&page=${page}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const libraryByRawgId = useMemo(() => {
    const map = new Map<number, UserGameEntry>();
    games.forEach((entry) => map.set(entry.rawgId, entry));
    return map;
  }, [games]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDebouncedQuery(query.trim());
  };

  const handleAdd = (result: SearchResult) => {
    addOrUpdateGame({
      rawgId: result.id,
      slug: result.slug,
      title: result.name,
      coverImage: result.coverImage,
      platforms: result.platforms.map((p) => p.name),
      ownership: "none",
      status: "not_started",
      personalRating: null,
      playtimeHours: 0,
      lastPlayedAt: null,
      notes: "",
      releaseYear: result.releaseYear,
      rawgRating: result.rating,
      rawgRatingsCount: result.ratingsCount,
      rawgPlaytime: result.playtime,
      metacritic: result.metacritic,
      genres: result.genres,
      boxArtSource: result.source,
    });
  };

  const handleOwnershipChange = (rawgId: number, value: Ownership) => {
    updateGame(rawgId, { ownership: value });
  };

  const handleStatusChange = (rawgId: number, value: PlayStatus) => {
    const patch: Partial<UserGameEntry> = { status: value };
    if (value === "playing") {
      patch.lastPlayedAt = new Date().toISOString();
    }
    updateGame(rawgId, patch);
  };

  const handleRatingChange = (rawgId: number, value: number) => {
    updateGame(rawgId, { personalRating: value });
  };

  const handlePlaytimeChange = (rawgId: number, value: number) => {
    updateGame(rawgId, { playtimeHours: value });
  };

  const handleToggleNotes = (rawgId: number, current?: string) => {
    setExpandedNotes((prev) => (prev === rawgId ? null : rawgId));
    setNotesDraft((prev) => ({ ...prev, [rawgId]: current ?? "" }));
  };

  const handleSaveNotes = (rawgId: number) => {
    updateGame(rawgId, { notes: notesDraft[rawgId] ?? "" });
    setExpandedNotes(null);
  };

  const pagination = data?.pagination;
  const results = data?.results ?? [];

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-xl shadow-emerald-500/5 transition dark:border-white/10 dark:bg-[#081a32]/85"
      >
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-500">Discover games</p>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold text-slate-900 dark:text-white">Search the RAWG database, filter by console, and save wishlist ideas.</h2>
          <p className="max-w-3xl text-balance text-sm text-slate-600 dark:text-slate-300">Enter a title or pick a console to explore recommendations from RAWG with retro box art and gameplay videos fused automatically.</p>
        </header>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Search games</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by title or keyword"
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 dark:border-white/10 dark:bg-[#0e1d36]/90"
              type="text"
            />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Console / platform</span>
            <select
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 dark:border-white/10 dark:bg-[#0e1d36]/90"
            >
              <option value="">All platforms</option>
              {platforms.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col justify-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Search games
            </button>
          </div>
        </div>
        {pagination && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-slate-200 px-3 py-1 transition disabled:opacity-40 dark:border-white/10"
              >
                Previous
              </button>
              <span className="font-medium">Page</span>
              <input
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const next = Number.parseInt(pageInput, 10);
                    if (Number.isFinite(next) && next > 0) {
                      setPage(next);
                    }
                  }
                }}
                onBlur={() => {
                  const next = Number.parseInt(pageInput, 10);
                  if (Number.isFinite(next) && next > 0) {
                    setPage(next);
                  } else {
                    setPageInput(String(page));
                  }
                }}
                className="w-16 rounded border border-slate-200 px-2 py-1 text-center dark:border-white/10 dark:bg-[#0e1d36]/80"
              />
              <span>of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}</span>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-full border border-slate-200 px-3 py-1 transition disabled:opacity-40 dark:border-white/10"
              >
                Next
              </button>
            </div>
            <span className="hidden sm:inline">Showing {results.length} of {pagination.total} results</span>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching metadata…
          </div>
        )}
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-200">
            Unable to fetch games. Please try again in a moment.
          </p>
        )}
      </form>

      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => {
            const entry = libraryByRawgId.get(result.id);
            const inLibrary = Boolean(entry);
            const personalNotesOpen = expandedNotes === result.id;
            const draftValue = notesDraft[result.id] ?? entry?.notes ?? "";
            const canImport = result.source === "rawg";

            return (
              <article
                key={`${result.source}-${result.id}`}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-lg shadow-emerald-500/5 transition hover:-translate-y-1 hover:shadow-emerald-500/20 dark:border-white/10 dark:bg-[#0a1b33]/85"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-24 w-20 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80">
                    {result.coverImage ? (
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${result.coverImage})` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No art</div>
                    )}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/10 to-black/50" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{result.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {result.releaseYear ? `Released ${result.releaseYear}` : "Release year unknown"}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {result.rating ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <Star className="h-3 w-3" /> {result.rating.toFixed(1)} ({result.ratingsCount})
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">No rating</span>
                      )}
                      {result.metacritic && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          Metacritic {result.metacritic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {result.platforms.length > 0
                        ? result.platforms.map((platform) => platform.name).join(", ")
                        : "Platform info unavailable"}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Source: {result.source.toUpperCase()}</span>
                  {inLibrary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                      ✓ In library
                    </span>
                  ) : !canImport ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                      RAWG match required to import
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(result)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400"
                    >
                      <Plus className="h-4 w-4" /> Add to library
                    </button>
                  )}
                </div>

                {inLibrary && entry && (
                  <div className="space-y-3 rounded-xl border border-slate-200/60 bg-white/75 p-3 text-sm transition dark:border-white/10 dark:bg-[#0f213d]/80">
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Ownership</span>
                        <select
                          value={entry.ownership}
                          onChange={(event) => handleOwnershipChange(entry.rawgId, event.target.value as Ownership)}
                          className="rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-[#0e1d36]/80"
                        >
                          {ownershipOptions.map((option) => (
                            <option key={option} value={option}>
                              {option.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
                        <select
                          value={entry.status}
                          onChange={(event) => handleStatusChange(entry.rawgId, event.target.value as PlayStatus)}
                          className="rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-[#0e1d36]/80"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Personal rating</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={entry.personalRating ?? 0}
                          onChange={(event) => handleRatingChange(entry.rawgId, Number(event.target.value))}
                          className="rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-[#0e1d36]/80"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Playtime (hours)</span>
                        <input
                          type="number"
                          min={0}
                          value={entry.playtimeHours ?? 0}
                          onChange={(event) => handlePlaytimeChange(entry.rawgId, Number(event.target.value))}
                          className="rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-[#0e1d36]/80"
                        />
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleNotes(entry.rawgId, entry.notes)}
                        className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
                      >
                        {personalNotesOpen ? "Close notes" : "Edit notes"}
                      </button>
                      {personalNotesOpen && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={draftValue}
                            onChange={(event) => setNotesDraft((prev) => ({ ...prev, [entry.rawgId]: event.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0e1d36]/80 dark:text-slate-200"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedNotes(null)}
                              className="rounded-md border border-transparent px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNotes(entry.rawgId)}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-white shadow shadow-emerald-500/40 transition hover:bg-emerald-400"
                            >
                              Save notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!isLoading && !error && shouldSearch && results.length === 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-[#0a1930]/80 dark:text-slate-300">
          No games matched your search just yet. Try another title or choose a different console.
        </div>
      )}
    </section>
  );
}

