"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import clsx from "clsx";
import { Loader2, Plus, Star } from "lucide-react";

import { addGameToLibraryAction, updateUserGameAction } from "@/app/actions/user-games";
import { useLibrary } from "@/components/library/LibraryProvider";
import type { UserGameRow } from "@/lib/user-games";

const ownershipOptions: UserGameRow["ownership"][] = [
  "none",
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusOptions: UserGameRow["status"][] = ["not_started", "playing", "beaten", "completed", "dropped"];

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res)));

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { games, upsert } = useLibrary();

  const initialQuery = searchParams.get("q") ?? "";
  const initialPlatform = searchParams.get("platform") ?? "";
  const initialPage = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [platform, setPlatform] = useState(initialPlatform);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [isTransitioning, startTransition] = useTransition();
  const [notesTarget, setNotesTarget] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    fetcher("/api/platforms")
      .then((data: PlatformOption[]) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setPlatforms(sorted);
      })
      .catch(() => setPlatforms([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (platform) params.set("platform", platform);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [debouncedQuery, platform, page, pathname, router, startTransition]);

  const shouldSearch = debouncedQuery || platform;
  const { data, isLoading, error, mutate } = useSWR<SearchResponse>(
    shouldSearch ? `/api/games/search?q=${encodeURIComponent(debouncedQuery)}&platform=${platform}&page=${page}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const libraryByRawgId = useMemo(() => {
    const map = new Map<number, UserGameRow>();
    games.forEach((game) => map.set(game.rawg_id, game));
    return map;
  }, [games]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setDebouncedQuery(query.trim());
  };

  const handleAddToLibrary = async (result: SearchResult) => {
    const saved = await addGameToLibraryAction({
      rawgId: result.id,
      slug: result.slug,
      title: result.name,
      coverImage: result.coverImage,
      platforms: result.platforms.map((platform) => platform.name),
      genres: result.genres,
      released: result.releaseYear ? `${result.releaseYear}-01-01` : null,
      rating: result.rating,
      ratingsCount: result.ratingsCount,
      playtime: result.playtime,
    });
    mutate();
    upsert(saved);
  };

  const handleUpdate = async (gameId: string, updates: Partial<UserGameRow>) => {
    const optimistic = games.find((item) => item.id === gameId);
    if (optimistic) {
      upsert({ ...optimistic, ...updates });
    }
    const updated = await updateUserGameAction({
      id: gameId,
      ownership: updates.ownership,
      status: updates.status,
      personal_rating: updates.personal_rating,
      playtime_hours: updates.playtime_hours,
      last_played_at: updates.last_played_at,
      notes: updates.notes,
      cover_image: updates.cover_image,
      platforms: updates.platforms,
      genres: updates.genres,
    });
    upsert(updated);
  };

  const currentResults = data?.results ?? [];
  const pagination = data?.pagination;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[2fr_1fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Search</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                setPageInput("1");
              }}
              placeholder="Search games by title"
              className="w-full rounded-xl border border-slate-300/60 bg-white/70 px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Platform</span>
            <select
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value);
                setPage(1);
                setPageInput("1");
              }}
              className="w-full rounded-xl border border-slate-300/60 bg-white/70 px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="">All platforms</option>
              {platforms.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon />}
            Search
          </button>
        </form>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
          Failed to load results. Please try again.
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/40 dark:border-slate-800/60 dark:bg-slate-800/40"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && shouldSearch && !currentResults.length ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          No games match this search yet. Try a different title or platform.
        </div>
      ) : null}

      {!isLoading && currentResults.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing page {pagination?.page ?? 1} of {Math.ceil((pagination?.total ?? 0) / (pagination?.pageSize ?? 1))}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const nextPage = Number.parseInt(pageInput, 10);
                if (Number.isFinite(nextPage) && nextPage > 0) {
                  setPage(nextPage);
                }
              }}
              className="flex items-center gap-2"
            >
              <label className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Page</span>
                <input
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  type="number"
                  min={1}
                  className="w-20 rounded-lg border border-slate-300/60 bg-white/70 px-2 py-1 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
              >
                Go
              </button>
            </form>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {currentResults.map((result) => {
              const entry = libraryByRawgId.get(result.id);
              return (
                <article
                  key={result.id}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-20 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/40 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
                      {result.coverImage ? (
                        <img src={result.coverImage} alt={result.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                          No art
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{result.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {result.releaseYear ?? "Unknown"} · {result.platforms.map((platform) => platform.name).join(", ")}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {result.rating?.toFixed(1) ?? "—"}
                        </span>
                        <span>({result.ratingsCount} ratings)</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {!entry ? (
                      <button
                        type="button"
                        onClick={() => handleAddToLibrary(result)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                      >
                        <Plus className="h-4 w-4" /> Add to library
                      </button>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={entry.ownership}
                            onChange={(event) =>
                              handleUpdate(entry.id, { ownership: event.target.value as UserGameRow["ownership"] })
                            }
                            className="rounded-lg border border-slate-300/60 bg-white/70 px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                          >
                            {ownershipOptions.map((option) => (
                              <option key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                          <select
                            value={entry.status}
                            onChange={(event) =>
                              handleUpdate(entry.id, { status: event.target.value as UserGameRow["status"] })
                            }
                            className="rounded-lg border border-slate-300/60 bg-white/70 px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                          >
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center gap-1 rounded-lg border border-slate-300/60 bg-white/60 px-2 py-1 text-xs text-slate-700 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                            Rating
                            <input
                              type="number"
                              value={entry.personal_rating ?? ""}
                              onChange={(event) =>
                                handleUpdate(entry.id, {
                                  personal_rating: event.target.value ? Number(event.target.value) : null,
                                })
                              }
                              min={1}
                              max={10}
                              className="w-full bg-transparent text-right outline-none"
                            />
                          </label>
                          <label className="flex items-center gap-1 rounded-lg border border-slate-300/60 bg-white/60 px-2 py-1 text-xs text-slate-700 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                            Playtime
                            <input
                              type="number"
                              value={entry.playtime_hours ?? ""}
                              onChange={(event) =>
                                handleUpdate(entry.id, {
                                  playtime_hours: event.target.value ? Number(event.target.value) : null,
                                })
                              }
                              min={0}
                              className="w-full bg-transparent text-right outline-none"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNotesTarget(entry.id);
                            setNotesDraft(entry.notes ?? "");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-200"
                        >
                          Edit notes
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pagination?.hasPreviousPage}
              className={clsx(
                "rounded-lg border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!pagination?.hasNextPage}
              className={clsx(
                "rounded-lg border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {notesTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/30 dark:border-slate-800 dark:bg-slate-900/90">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h3>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              className="mt-4 h-40 w-full rounded-xl border border-slate-300/60 bg-white/80 p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
              placeholder="Personal notes about this game"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotesTarget(null)}
                className="rounded-lg border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!notesTarget) return;
                  handleUpdate(notesTarget, { notes: notesDraft });
                  setNotesTarget(null);
                }}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
