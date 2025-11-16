"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { GameCard, type SearchGameResult } from "@/components/GameCard";
import { DashboardStats } from "@/components/DashboardStats";
import { FiltersBar, type SortOption } from "@/components/FiltersBar";
import { SimilarGamesRow, type SimilarGame } from "@/components/SimilarGamesRow";
import { type Ownership, type PlayStatus, useLibrary, type UserGame } from "@/hooks/LibraryProvider";
import { normalizeRawgImageUrl, pickBestRawgImage } from "@/lib/images";

interface SearchResponse {
  results: SearchGameResult[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface GameMetadata {
  rating: number | null;
  released: string | null;
  coverImage: string | null;
}

interface SimilarResponse {
  results: SimilarGame[];
}

const SEARCH_STORAGE_KEY = "dgtracker:librarySearch";
const PAGE_SIZE = 5;

const createDefaultPagination = (): SearchResponse["pagination"] => ({
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  hasNextPage: false,
  hasPreviousPage: false,
});

type StoredSearchState = {
  query: string;
  debouncedQuery: string;
  results: SearchGameResult[];
  pagination: SearchResponse["pagination"];
  metadataById: Record<number, GameMetadata>;
};

export default function DashboardPage() {
  const { games: libraryGames, loading: libraryLoading, upsert, update, remove } = useLibrary();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchGameResult[]>([]);
  const [pagination, setPagination] = useState<SearchResponse["pagination"]>(createDefaultPagination);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [metadataById, setMetadataById] = useState<Record<number, GameMetadata>>({});
  const [ownershipFilter, setOwnershipFilter] = useState<Ownership | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PlayStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string | "all">("all");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOption>("added_date");
  const [hasHydratedSearchState, setHasHydratedSearchState] = useState(false);
  const [similarSource, setSimilarSource] = useState<SearchGameResult | null>(null);
  const [similarResults, setSimilarResults] = useState<SimilarGame[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const [currentLibraryRoute, setCurrentLibraryRoute] = useState("/library");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const { pathname, search } = window.location;
    setCurrentLibraryRoute(search ? `${pathname}${search}` : pathname);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedRaw = window.sessionStorage.getItem(SEARCH_STORAGE_KEY);
      if (!storedRaw) {
        setHasHydratedSearchState(true);
        return;
      }

      const parsed = JSON.parse(storedRaw) as Partial<StoredSearchState> | null;
      if (!parsed) {
        setHasHydratedSearchState(true);
        return;
      }

      if (typeof parsed.query === "string") {
        setQuery(parsed.query);
      }

      if (typeof parsed.debouncedQuery === "string") {
        setDebouncedQuery(parsed.debouncedQuery);
      } else if (typeof parsed.query === "string") {
        setDebouncedQuery(parsed.query.trim());
      }

      if (Array.isArray(parsed.results)) {
        setSearchResults(parsed.results);
      }

      if (parsed.pagination) {
        setPagination({
          total: typeof parsed.pagination.total === "number" ? parsed.pagination.total : 0,
          page: typeof parsed.pagination.page === "number" ? parsed.pagination.page : 1,
          pageSize: typeof parsed.pagination.pageSize === "number" ? parsed.pagination.pageSize : PAGE_SIZE,
          hasNextPage: Boolean(parsed.pagination.hasNextPage),
          hasPreviousPage: Boolean(parsed.pagination.hasPreviousPage),
        });
      }

      if (parsed.metadataById && typeof parsed.metadataById === "object") {
        const sanitizedEntries = Object.entries(parsed.metadataById).reduce<Record<number, GameMetadata>>(
          (acc, [key, value]) => {
            const id = Number.parseInt(key, 10);
            if (!Number.isFinite(id) || !value || typeof value !== "object") {
              return acc;
            }
            const maybeMetadata = value as Partial<GameMetadata>;
            acc[id] = {
              rating: typeof maybeMetadata.rating === "number" ? maybeMetadata.rating : null,
              released: typeof maybeMetadata.released === "string" ? maybeMetadata.released : null,
              coverImage: maybeMetadata.coverImage
                ? normalizeRawgImageUrl(maybeMetadata.coverImage)
                : null,
            };
            return acc;
          },
          {},
        );
        setMetadataById(sanitizedEntries);
      }
    } catch (error) {
      console.warn("Failed to restore library search state", error);
    } finally {
      setHasHydratedSearchState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedSearchState || typeof window === "undefined") {
      return;
    }

    const state: StoredSearchState = {
      query,
      debouncedQuery,
      results: searchResults,
      pagination,
      metadataById,
    };

    try {
      window.sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to persist library search state", error);
    }
  }, [hasHydratedSearchState, query, debouncedQuery, searchResults, pagination, metadataById]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setPagination(createDefaultPagination());
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const response = await fetch(`/api/rawg/search?q=${encodeURIComponent(debouncedQuery)}&page=${pagination.page}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Unable to search games.");
        }
        const data = (await response.json()) as SearchResponse;
        if (cancelled) return;
        setSearchResults(data.results);
        setPagination(data.pagination);
          setMetadataById((prev) => {
            const next = { ...prev };
            for (const game of data.results) {
              next[game.id] = {
                rating: game.rating ?? null,
                released: game.released ?? null,
                coverImage: normalizeRawgImageUrl(game.background_image),
              };
            }
            return next;
          });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSearchError(error instanceof Error ? error.message : "Unable to search games.");
        setSearchResults([]);
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery, pagination.page]);

  useEffect(() => {
    const needsHydration = libraryGames.filter((game) => {
      const metadata = metadataById[game.rawgId];
      if (!metadata) {
        return true;
      }
      if (!game.coverImage && !metadata.coverImage) {
        return true;
      }
      return false;
    });
    if (!needsHydration.length) {
      return;
    }

    let cancelled = false;

    type DetailsHydrationResponse = {
      rating: number | null;
      released: string | null;
      background_image: string | null;
      background_image_additional: string | null;
      short_screenshots?: Array<{ image: string | null }>;
    };

    const hydrateMetadata = async () => {
      for (const game of needsHydration) {
        try {
          const response = await fetch(`/api/rawg/details/${game.rawgId}`);
          if (!response.ok) {
            continue;
          }
          const data = (await response.json()) as DetailsHydrationResponse;
          if (cancelled) return;
          const coverCandidate =
            pickBestRawgImage([
              data.background_image,
              data.background_image_additional,
              ...(data.short_screenshots?.map((shot) => shot.image) ?? []),
            ]) ?? null;
          setMetadataById((prev) => ({
            ...prev,
            [game.rawgId]: {
              rating: data.rating ?? prev[game.rawgId]?.rating ?? null,
              released: data.released ?? prev[game.rawgId]?.released ?? null,
              coverImage: coverCandidate ?? prev[game.rawgId]?.coverImage ?? null,
            },
          }));
          if (!game.coverImage && coverCandidate) {
            update(game.rawgId, { coverImage: coverCandidate });
          }
        } catch (error) {
          if (cancelled) {
            return;
          }
          console.warn("Failed to hydrate library metadata", error);
        }
      }
    };

    hydrateMetadata();

    return () => {
      cancelled = true;
    };
  }, [libraryGames, metadataById, update]);

  useEffect(() => {
    if (!similarSource) {
      setSimilarResults([]);
      setSimilarError(null);
      setSimilarLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadSimilar = async () => {
      try {
        setSimilarLoading(true);
        setSimilarError(null);
        const response = await fetch(`/api/rawg/similar/${similarSource.id}`, { signal: controller.signal });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Unable to load similar games.");
        }
        const data = (await response.json()) as SimilarResponse;
        if (cancelled) return;
        setSimilarResults(data.results ?? []);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSimilarError(error instanceof Error ? error.message : "Unable to load similar games.");
        setSimilarResults([]);
      } finally {
        if (!cancelled) {
          setSimilarLoading(false);
        }
      }
    };

    loadSimilar();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [similarSource]);

  useEffect(() => {
    if (typeof window === "undefined" || !similarSource) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSimilarSource(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [similarSource]);

  useEffect(() => {
    if (typeof document === "undefined" || !similarSource) {
      return;
    }

    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [similarSource]);

  const closeSimilarModal = () => {
    setSimilarSource(null);
    setSimilarResults([]);
    setSimilarError(null);
    setSimilarLoading(false);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDebouncedQuery(query.trim());
  };

  const handleAddToLibrary = (game: SearchGameResult) => {
    const metadata = metadataById[game.id];
    const coverImage = normalizeRawgImageUrl(metadata?.coverImage ?? game.background_image ?? null);
    const normalizedPlatforms =
      game.parent_platforms?.map((entry) => entry.platform) ??
      game.platforms?.map((entry) => entry.platform) ??
      [];
    const created = upsert({
      rawgId: game.id,
      slug: game.slug ?? `${game.id}`,
      title: game.name,
      platforms: normalizedPlatforms.map((platform) => platform.name),
      coverImage,
      playtimeHours: 0,
    });
    setMetadataById((prev) => ({
      ...prev,
      [created.rawgId]: {
        rating: game.rating ?? null,
        released: game.released ?? null,
        coverImage,
      },
    }));
  };

  const handleUpdateLibrary = (rawgId: number, patch: Partial<UserGame>) => {
    update(rawgId, patch);
  };

  const handleRemoveLibrary = (rawgId: number) => {
    remove(rawgId);
  };

  const libraryPlatforms = useMemo(() => {
    const set = new Set<string>();
    libraryGames.forEach((game) => {
      game.platforms.forEach((platform) => set.add(platform));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [libraryGames]);

  const filteredLibrary = useMemo(() => {
    return libraryGames
      .filter((game) => {
        if (ownershipFilter !== "all" && game.ownership !== ownershipFilter) {
          return false;
        }
        if (statusFilter !== "all" && game.status !== statusFilter) {
          return false;
        }
        if (platformFilter !== "all" && !game.platforms.includes(platformFilter)) {
          return false;
        }
        if (minRating !== null) {
          const rating = typeof game.personalRating === "number" ? game.personalRating : 0;
          if (rating < minRating) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const metadataA = metadataById[a.rawgId];
        const metadataB = metadataById[b.rawgId];
        switch (sortOrder) {
          case "title":
            return a.title.localeCompare(b.title);
          case "release_year": {
            const yearA = metadataA?.released ? Number.parseInt(metadataA.released.slice(0, 4), 10) : 0;
            const yearB = metadataB?.released ? Number.parseInt(metadataB.released.slice(0, 4), 10) : 0;
            if (yearA === yearB) {
              return a.title.localeCompare(b.title);
            }
            return yearB - yearA;
          }
          case "rawg_rating": {
            const ratingA = metadataA?.rating ?? -Infinity;
            const ratingB = metadataB?.rating ?? -Infinity;
            if (ratingA === ratingB) {
              return a.title.localeCompare(b.title);
            }
            return (ratingB || 0) - (ratingA || 0);
          }
          case "personal_rating": {
            const ratingA = a.personalRating ?? -Infinity;
            const ratingB = b.personalRating ?? -Infinity;
            if (ratingA === ratingB) {
              return a.title.localeCompare(b.title);
            }
            return (ratingB || 0) - (ratingA || 0);
          }
          case "last_played": {
            const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
            const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
            if (timeA === timeB) {
              return a.title.localeCompare(b.title);
            }
            return timeB - timeA;
          }
          case "added_date":
          default: {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            if (timeA === timeB) {
              return a.title.localeCompare(b.title);
            }
            return timeB - timeA;
          }
        }
      });
  }, [libraryGames, metadataById, ownershipFilter, statusFilter, platformFilter, minRating, sortOrder]);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Discover games</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Search RAWG without exposing your API key. Add favorites to your personal library and keep your progress synced locally.
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search game titles..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <Search className="h-4 w-4" /> Search
            </button>
          </form>
          {searchError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {searchError}
            </p>
          ) : null}
          {searchLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching RAWG...
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {searchResults.map((result) => {
              const userGame = libraryGames.find((game) => game.rawgId === result.id);
              const metadata = metadataById[result.id];
              const coverOverride = normalizeRawgImageUrl(
                metadata?.coverImage ?? result.background_image ?? null,
              );
              return (
                <GameCard
                  key={result.id}
                  game={result}
                  coverOverride={coverOverride}
                  userGame={userGame}
                  onAdd={handleAddToLibrary}
                  onUpdate={handleUpdateLibrary}
                  onRemove={handleRemoveLibrary}
                  onShowSimilar={setSimilarSource}
                  rawgReturnTo={currentLibraryRoute}
                />
              );
            })}
          </div>
          {debouncedQuery && !searchLoading && !searchResults.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No games found for this search term.</p>
          ) : null}
          {debouncedQuery && (pagination.hasNextPage || pagination.hasPreviousPage) ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={!pagination.hasPreviousPage || searchLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                Previous
              </button>
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Page {pagination.page} • {pagination.total} results
              </span>
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage || searchLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your library</h2>
          {libraryLoading ? (
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Loading...</span>
          ) : (
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{libraryGames.length} games saved</span>
          )}
        </div>
        <DashboardStats games={libraryGames} />
        <FiltersBar
          ownership={ownershipFilter}
          onOwnershipChange={setOwnershipFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          platform={platformFilter}
          onPlatformChange={setPlatformFilter}
          availablePlatforms={libraryPlatforms}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
        {filteredLibrary.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLibrary.map((userGame) => {
              const metadata = metadataById[userGame.rawgId];
              const coverImage = normalizeRawgImageUrl(
                userGame.coverImage ?? metadata?.coverImage ?? null,
              );
              const cardData: SearchGameResult = {
                id: userGame.rawgId,
                slug: userGame.slug,
                name: userGame.title,
                background_image: coverImage,
                rating: metadata?.rating ?? null,
                genres: [],
                platforms: userGame.platforms.map((platform, index) => ({
                  platform: {
                    id: index,
                    name: platform,
                    slug: platform.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  },
                })),
                playtime: userGame.playtimeHours,
                released: metadata?.released ?? null,
              };
              return (
                <GameCard
                  key={userGame.rawgId}
                  game={cardData}
                  coverOverride={coverImage}
                  userGame={userGame}
                  onUpdate={handleUpdateLibrary}
                  onRemove={handleRemoveLibrary}
                  onShowSimilar={setSimilarSource}
                  rawgReturnTo={currentLibraryRoute}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add games from the search above to build your personal collection. Filters will appear once you have saved games.
          </p>
        )}
      </section>
      {similarSource ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Similar games"
          onClick={closeSimilarModal}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeSimilarModal}
              className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-200"
            >
              Close <X className="h-3.5 w-3.5" />
            </button>
            <div className="space-y-2 pr-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Suggested for</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{similarSource.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Explore related titles. Selecting a card opens the full library view for that game.
              </p>
            </div>
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
              {similarLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading similar games...
                </div>
              ) : similarError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" /> {similarError}
                </div>
              ) : similarResults.length ? (
                <SimilarGamesRow games={similarResults} />
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No similar games available for this title yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
