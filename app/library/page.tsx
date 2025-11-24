"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import type { SearchGameResult } from "@/components/GameCard";
import { DashboardStats } from "@/components/DashboardStats";
import { FiltersBar, type SortOption } from "@/components/FiltersBar";
import { GameStatusControls } from "@/components/GameStatusControls";
import { SimilarGamesRow, type SimilarGame } from "@/components/SimilarGamesRow";
import { type Ownership, type PlayStatus, useLibrary, type UserGame } from "@/hooks/LibraryProvider";
import { igdbCoverUrl, igdbImage } from "@/lib/igdbImages";
import { getBestCover } from "@/lib/getCoverArt";
import { normalizeImageUrl } from "@/lib/images";
import type { GameArtwork, GameScreenshot } from "@/lib/gameData";

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
  releaseYear: number | null;
  ratingsCount: number | null;
  coverImage: string | null;
}

interface SimilarResponse {
  results: SimilarGame[];
}

const SEARCH_STORAGE_KEY = "dgtracker:librarySearch";
const PAGE_SIZE = 6;

const getResultCover = (game: SearchGameResult | null | undefined): string | null => {
  if (!game) {
    return null;
  }
  const coverId = (game as { cover?: { image_id?: string | null } } | null)?.cover?.image_id ?? null;
  const igdbCover = igdbCoverUrl(coverId);
  if (igdbCover) {
    return igdbCover;
  }
  if (game.coverUrl) {
    return game.coverUrl;
  }
  if (game.coverImageUrl) {
    return game.coverImageUrl;
  }
  const screenshots = getResultScreenshots(game);
  return screenshots[0] ?? null;
};

const getResultScreenshots = (game: SearchGameResult | null | undefined): string[] => {
  if (!game) {
    return [];
  }

  const rawScreens = (game as any)?.screenshots;
  if (Array.isArray(rawScreens) && rawScreens.length) {
    const resolved = rawScreens
      .map((shot: any) => {
        const id = shot?.image_id ?? null;
        return id ? igdbImage(id, "t_screenshot_huge") : typeof shot === "string" ? shot : null;
      })
      .filter((url): url is string => Boolean(url));
    if (resolved.length) {
      return resolved;
    }
  }

  if (Array.isArray(game.screenshotUrls) && game.screenshotUrls.length) {
    return game.screenshotUrls.filter((url): url is string => typeof url === "string");
  }

  return Array.isArray(game.screenshots)
    ? game.screenshots.filter((url): url is string => typeof url === "string")
    : [];
};

type DiscoverSortOption =
  | "none"
  | "most_popular"
  | "highest_rated"
  | "newest"
  | "oldest"
  | "alphabetical";

const DISCOVER_SORT_OPTIONS: Array<{ value: DiscoverSortOption; label: string }> = [
  { value: "none", label: "No sort (default)" },
  { value: "most_popular", label: "Most popular" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "A → Z" },
];

const mapSortOrderToApiParam = (sort: DiscoverSortOption): string => sort;

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
  sortOrder: DiscoverSortOption;
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
  const [searchSortOrder, setSearchSortOrder] = useState<DiscoverSortOption>("none");
  const [librarySearch, setLibrarySearch] = useState("");
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
  const [pageInputValue, setPageInputValue] = useState("1");
  const previousQueryRef = useRef<string | null>(null);

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
            const maybeMetadata = value as Partial<GameMetadata> & { released?: string | null };
            const storedRelease = maybeMetadata.releaseYear ?? maybeMetadata.released;
            const releaseYear =
              typeof storedRelease === "number"
                ? storedRelease
                : typeof storedRelease === "string"
                  ? (() => {
                      const parsedYear = Number.parseInt(storedRelease.slice(0, 4), 10);
                      return Number.isFinite(parsedYear) ? parsedYear : null;
                    })()
                  : null;
            acc[id] = {
              rating: typeof maybeMetadata.rating === "number" ? maybeMetadata.rating : null,
              releaseYear,
              ratingsCount:
                typeof maybeMetadata.ratingsCount === "number" ? maybeMetadata.ratingsCount : null,
              coverImage: maybeMetadata.coverImage
                ? normalizeImageUrl(maybeMetadata.coverImage)
                : null,
            };
            return acc;
          },
          {},
        );
        setMetadataById(sanitizedEntries);
      }

      if (
        parsed.sortOrder &&
        DISCOVER_SORT_OPTIONS.some((option) => option.value === parsed.sortOrder)
      ) {
        setSearchSortOrder(parsed.sortOrder);
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
      sortOrder: searchSortOrder,
    };

    try {
      window.sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to persist library search state", error);
    }
  }, [
    hasHydratedSearchState,
    query,
    debouncedQuery,
    searchResults,
    pagination,
    metadataById,
    searchSortOrder,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!hasHydratedSearchState) {
      return;
    }
    if (previousQueryRef.current === null) {
      previousQueryRef.current = debouncedQuery;
      return;
    }
    if (previousQueryRef.current === debouncedQuery) {
      return;
    }
    previousQueryRef.current = debouncedQuery;
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [debouncedQuery, hasHydratedSearchState]);

  useEffect(() => {
    if (!hasHydratedSearchState) {
      return;
    }
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [searchSortOrder, hasHydratedSearchState]);

  useEffect(() => {
    setPageInputValue(String(pagination.page));
  }, [pagination.page]);

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
        const currentPage = pagination.page;
        const response = await fetch(`/api/games/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            query: debouncedQuery,
            sort: mapSortOrderToApiParam(searchSortOrder),
            platform: "all",
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | Partial<SearchResponse>
          | { error?: string }
          | null;
        const data = (payload && typeof payload === "object" ? payload : null) as Partial<SearchResponse>;
        if (cancelled) return;
        const normalizedResults = (Array.isArray(data.results)
          ? (data.results as SearchGameResult[])
          : Array.isArray((data as any)?.games)
            ? ((data as any).games as SearchGameResult[])
            : [])
          .map((result) => {
            const coverImageId = (result as { cover?: { image_id?: string | null } }).cover?.image_id ?? null;
            const coverUrl = normalizeImageUrl(
              igdbCoverUrl(coverImageId) ?? result.coverUrl ?? result.coverImageUrl ?? null,
            );
            const screenshots = getResultScreenshots(result);
            const releaseYear = typeof result.releaseYear === "number"
              ? result.releaseYear
              : (result as { first_release_date?: number | null }).first_release_date
                  ? new Date(
                      Number((result as { first_release_date?: number | null }).first_release_date) * 1000,
                    ).getFullYear()
                  : null;
            const platforms = Array.isArray(result.platforms)
              ? result.platforms.map((platform) => ({
                  id: platform.id,
                  name: platform.name,
                  slug: platform.slug ?? platform.name?.toLowerCase() ?? `${platform.id}`,
                  abbreviation: platform.abbreviation ?? null,
                }))
              : [];
            const rating = typeof result.rating === "number"
              ? result.rating
              : (result as { total_rating?: number | null } | null)?.total_rating ?? null;
            const ratingsCount = typeof result.ratingsCount === "number"
              ? result.ratingsCount
              : typeof (result as { rating_count?: number | null } | null)?.rating_count === "number"
                ? (result as { rating_count?: number | null } | null)?.rating_count ?? 0
                : typeof (result as { total_rating_count?: number | null } | null)?.total_rating_count === "number"
                  ? (result as { total_rating_count?: number | null } | null)?.total_rating_count ?? 0
                  : 0;

            return {
              ...result,
              coverUrl,
              coverImageUrl: coverUrl ?? result.coverImageUrl ?? null,
              cover: result.cover ?? (coverImageId ? { image_id: coverImageId } : undefined),
              screenshots,
              screenshotUrls: screenshots,
              releaseYear,
              rating,
              ratingsCount,
              platforms,
            } as SearchGameResult;
          });
        if ((data as { error?: string } | null)?.error) {
          setSearchError((data as { error?: string }).error ?? null);
        }
        const totalResults = normalizedResults.length;
        const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
        const safePage = Math.min(Math.max(currentPage, 1), totalPages);
        const nextPagination = {
          total: totalResults,
          page: safePage,
          pageSize: PAGE_SIZE,
          hasNextPage: safePage < totalPages,
          hasPreviousPage: safePage > 1,
        };
        setSearchResults(normalizedResults);
        setPagination(nextPagination);
        setMetadataById((prev) => {
          const next = { ...prev };
          for (const game of normalizedResults) {
            const resolvedCover = normalizeImageUrl(
              getResultCover(game) ?? next[game.id]?.coverImage ?? null,
            );
            next[game.id] = {
              rating: game.rating ?? next[game.id]?.rating ?? null,
              releaseYear: game.releaseYear ?? next[game.id]?.releaseYear ?? null,
              ratingsCount: game.ratingsCount ?? next[game.id]?.ratingsCount ?? null,
              coverImage: resolvedCover ?? next[game.id]?.coverImage ?? null,
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
        setPagination(createDefaultPagination());
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
  }, [debouncedQuery, pagination.page, searchSortOrder]);

  useEffect(() => {
    const needsHydration = libraryGames.filter((game) => {
      const metadata = metadataById[game.igdbId];
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
      ratings_count?: number | null;
      released: string | null;
      background_image: string | null;
      background_image_additional: string | null;
      cover: { image_id?: string | null } | null;
      artworks?: GameArtwork[];
      short_screenshots?: GameScreenshot[];
    };

    const hydrateMetadata = async () => {
      for (const game of needsHydration) {
        try {
          const response = await fetch(`/api/igdb/details/${game.igdbId}`);
          if (!response.ok) {
            continue;
          }
          const data = (await response.json()) as DetailsHydrationResponse;
          if (cancelled) return;
          const coverCandidate =
            getBestCover({
              background_image: data.background_image,
              background_image_additional: data.background_image_additional,
              short_screenshots: data.short_screenshots,
              artworks: data.artworks ?? [],
              clip: null,
              cover: data.cover,
            }) ?? null;
          setMetadataById((prev) => {
            const current = prev[game.igdbId];
            const parsedYear =
              data.released && data.released.length >= 4
                ? Number.parseInt(data.released.slice(0, 4), 10)
                : NaN;
            const releaseYear = Number.isFinite(parsedYear) ? parsedYear : current?.releaseYear ?? null;
            const ratingsCount =
              typeof data.ratings_count === "number"
                ? data.ratings_count
                : current?.ratingsCount ?? null;
            return {
              ...prev,
              [game.igdbId]: {
                rating: data.rating ?? current?.rating ?? null,
                releaseYear,
                ratingsCount,
                coverImage: coverCandidate ?? current?.coverImage ?? null,
              },
            };
          });
          if (!game.coverImage && coverCandidate) {
            update(game.igdbId, { coverImage: coverCandidate });
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
        const response = await fetch(`/api/igdb/similar/${similarSource.id}`, { signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as
          | Partial<SimilarResponse>
          | { error?: string }
          | null;
        if (!response.ok || !payload || typeof payload !== "object") {
          const message = (payload as { error?: string } | null)?.error ?? "Unable to load similar games.";
          throw new Error(message);
        }
        const data = payload as Partial<SimilarResponse>;
        if (cancelled) return;
        setSimilarResults(Array.isArray(data.results) ? data.results : []);
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

  const totalDiscoverPages = Math.max(1, Math.ceil(Math.max(pagination.total, searchResults.length) / PAGE_SIZE));
  const paginatedResults = searchResults.slice(
    (pagination.page - 1) * PAGE_SIZE,
    pagination.page * PAGE_SIZE,
  );

  const handlePageJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pageInputValue) {
      setPageInputValue(String(pagination.page));
      return;
    }
    const parsed = Number.parseInt(pageInputValue, 10);
    if (!Number.isFinite(parsed)) {
      setPageInputValue(String(pagination.page));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), totalDiscoverPages);
    setPagination((prev) => ({ ...prev, page: nextPage }));
  };

  const handleAddToLibrary = (game: SearchGameResult) => {
    const metadata = metadataById[game.id];
    const coverImage = normalizeImageUrl(metadata?.coverImage ?? getResultCover(game));
    const platformNames = (game.platforms ?? []).map((platform) => platform.name);
    const created = upsert({
      igdbId: game.id,
      slug: game.slug ?? `${game.id}`,
      title: game.name,
      platforms: platformNames,
      coverImage,
      playtimeHours: 0,
    });
    setMetadataById((prev) => ({
      ...prev,
      [created.igdbId]: {
        rating: game.rating ?? null,
        releaseYear: game.releaseYear ?? prev[created.igdbId]?.releaseYear ?? null,
        ratingsCount: game.ratingsCount ?? prev[created.igdbId]?.ratingsCount ?? null,
        coverImage: coverImage ?? prev[created.igdbId]?.coverImage ?? null,
      },
    }));
  };

  const handleUpdateLibrary = (igdbId: number, patch: Partial<UserGame>) => {
    update(igdbId, patch);
  };

  const handleRemoveLibrary = (igdbId: number) => {
    remove(igdbId);
  };

  const libraryPlatforms = useMemo(() => {
    const set = new Set<string>();
    libraryGames.forEach((game) => {
      game.platforms.forEach((platform) => set.add(platform));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [libraryGames]);

  const filteredLibrary = useMemo(() => {
    const normalizedQuery = librarySearch.trim().toLowerCase();

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
        if (normalizedQuery) {
          const title = game.title.toLowerCase();
          const platforms = game.platforms.map((platform) => platform.toLowerCase()).join(" ");
          if (!title.includes(normalizedQuery) && !platforms.includes(normalizedQuery)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const metadataA = metadataById[a.igdbId];
        const metadataB = metadataById[b.igdbId];
        switch (sortOrder) {
          case "title":
            return a.title.localeCompare(b.title);
          case "release_year": {
            const yearA = metadataA?.releaseYear ?? 0;
            const yearB = metadataB?.releaseYear ?? 0;
            if (yearA === yearB) {
              return a.title.localeCompare(b.title);
            }
            return yearB - yearA;
          }
          case "igdb_popularity": {
            const countA = metadataA?.ratingsCount ?? 0;
            const countB = metadataB?.ratingsCount ?? 0;
            if (countA === countB) {
              return a.title.localeCompare(b.title);
            }
            return countB - countA;
          }
          case "igdb_rating": {
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
  }, [
    libraryGames,
    librarySearch,
    metadataById,
    ownershipFilter,
    statusFilter,
    platformFilter,
    minRating,
    sortOrder,
  ]);

  const hasSearchQuery = debouncedQuery.length > 0;
  const discoverCanGoPrevious = pagination.hasPreviousPage || pagination.page > 1;
  const discoverCanGoNext = pagination.hasNextPage || pagination.page < totalDiscoverPages;
  const showDiscoverPagination = hasSearchQuery && (totalDiscoverPages > 1);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Discover games</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Search IGDB without exposing your API key. Add favorites to your personal library and keep your progress synced locally.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-3 sm:flex-row lg:flex-1">
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
            <label className="flex w-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:w-60">
              Sort results
              <select
                value={searchSortOrder}
                onChange={(event) => setSearchSortOrder(event.target.value as DiscoverSortOption)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {DISCOVER_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {searchError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {searchError}
            </p>
          ) : null}
          {searchLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching IGDB...
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedResults.map((result) => {
              const userGame = libraryGames.find((game) => game.igdbId === result.id);
              const metadata = metadataById[result.id];
              const coverImageId = (result as { cover?: { image_id?: string | null } }).cover?.image_id ?? null;
              const coverOverride = normalizeImageUrl(
                igdbCoverUrl(coverImageId) ?? metadata?.coverImage ?? getResultCover(result),
              );
              const normalizedScreenshots = getResultScreenshots(result);
              const normalizedResult: SearchGameResult = {
                ...result,
                genres: Array.isArray(result.genres) ? result.genres : [],
                coverUrl: coverOverride ?? result.coverUrl ?? result.coverImageUrl ?? null,
                coverImageUrl: coverOverride ?? result.coverImageUrl ?? null,
                screenshots: normalizedScreenshots,
                screenshotUrls: normalizedScreenshots,
              };
              const cardData: CompactGameCardData = {
                id: normalizedResult.id,
                name: normalizedResult.name,
                coverImageId,
                coverUrl: normalizedResult.coverUrl,
                rating: normalizedResult.rating ?? metadata?.rating ?? null,
                ratingsCount: normalizedResult.ratingsCount ?? metadata?.ratingsCount ?? null,
                releaseYear: normalizedResult.releaseYear ?? metadata?.releaseYear ?? null,
                platforms: normalizedResult.platforms ?? [],
              };
              return (
                <GameCardCompact
                  key={result.id}
                  game={cardData}
                  actionLabel={userGame ? "Saved" : "Add to library"}
                  onAction={() => handleAddToLibrary(normalizedResult)}
                  actionDisabled={Boolean(userGame)}
                />
              );
            })}
          </div>
          {debouncedQuery && !searchLoading && !searchResults.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No games found for this search term.</p>
          ) : null}
          {showDiscoverPagination ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={!discoverCanGoPrevious || searchLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!discoverCanGoNext || searchLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
                >
                  Next
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>
                  Page {pagination.page} of {totalDiscoverPages} • {pagination.total} results
                </span>
                <form onSubmit={handlePageJumpSubmit} className="flex items-center gap-2 text-[11px] normal-case">
                  <label htmlFor="discover-page-input" className="font-semibold text-slate-600 dark:text-slate-300">
                    Jump to
                  </label>
                  <input
                    id="discover-page-input"
                    type="number"
                    min={1}
                    max={totalDiscoverPages}
                    value={pageInputValue}
                    onChange={(event) => setPageInputValue(event.target.value)}
                    className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-emerald-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-500/70 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                  >
                    Go
                  </button>
                </form>
              </div>
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
        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Search library
            </span>
            <input
              type="text"
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder="Cari judul game di library..."
              className="w-full rounded-lg bg-slate-900/5 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-emerald-500 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
            />
          </label>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredLibrary.map((userGame) => {
              const metadata = metadataById[userGame.igdbId];
              const coverImage = normalizeImageUrl(
                userGame.coverImage ?? metadata?.coverImage ?? null,
              );
              const cardData: CompactGameCardData = {
                id: userGame.igdbId,
                name: userGame.title,
                coverImageId: null,
                coverUrl: coverImage,
                rating: metadata?.rating ?? null,
                ratingsCount: metadata?.ratingsCount ?? 0,
                releaseYear: metadata?.releaseYear ?? null,
                platforms: userGame.platforms.map((platform, index) => ({
                  id: index,
                  name: platform,
                  slug: platform.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  abbreviation: null,
                })),
              };
              return (
                <GameCardCompact
                  key={userGame.igdbId}
                  game={cardData}
                  footer={
                    <GameStatusControls
                      userGame={userGame}
                      onUpdate={handleUpdateLibrary}
                      onRemove={handleRemoveLibrary}
                    />
                  }
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
