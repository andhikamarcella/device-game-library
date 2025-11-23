"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, Star } from "lucide-react";
import { Card } from "@/components/Card";
import { GameCard, type SearchGameResult as CardResult } from "@/components/GameCard";
import { GameCardCompact } from "@/components/GameCardCompact";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import EventsSection from "@/components/EventsSection";
import {
  AgeRatingFilter,
  FiltersResetButton,
  GameModeFilter,
  GenreFilter,
  PerspectiveFilter,
  ThemeFilter,
  YearRangePicker,
  type SearchFilterOption,
} from "@/components/SearchFiltersPanel";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { igdbCoverUrl } from "@/lib/igdbImages";
import { normalizeImageUrl } from "@/lib/images";
import { formatDateTime } from "@/lib/utils";
import { GameStatus, Game } from "@/lib/types";
import type { IgdbAgeRating } from "@/types/igdb";

type SearchPlatform = {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string | null;
};

type SearchResult = {
  id: number;
  slug: string | null;
  name: string;
  summary: string;
  coverUrl: string | null;
  coverImageUrl?: string | null;
  screenshots: string[];
  screenshotUrls?: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
  genres: string[];
};

const getResultCover = (game: SearchResult | null | undefined): string => {
  if (!game) {
    return "/fallback/cover-placeholder.svg";
  }

  const candidates = [
    game.coverUrl,
    game.coverImageUrl,
    Array.isArray(game.screenshots) && game.screenshots.length ? game.screenshots[0] : null,
    Array.isArray(game.screenshotUrls) && game.screenshotUrls.length ? game.screenshotUrls[0] : null,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) return normalized;
  }

  return "/fallback/cover-placeholder.svg";
};

const getResultScreenshots = (game: SearchResult | null | undefined): string[] => {
  if (!game) {
    return [];
  }
  if (Array.isArray(game.screenshots) && game.screenshots.length) {
    return game.screenshots;
  }
  if (Array.isArray(game.screenshotUrls) && game.screenshotUrls.length) {
    return game.screenshotUrls;
  }
  return [];
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

type DetailMetadata = {
  id: number;
  name?: string;
  description?: string;
  thumbnail: string | null;
  backgroundImage: string | null;
  coverImageUrl?: string | null;
  screenshotUrls?: string[];
  gallery: Array<{ id: number; url: string | null }>;
  genres?: string[];
  platforms?: string[];
  rating?: number | null;
  ratingsCount?: number | null;
};

type PlatformOption = {
  id: number;
  name: string;
  slug: string;
  yearStart: number | null;
  image: string | null;
  abbreviation?: string | null;
};

const statusLabels: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

const DISCOVER_SORT_OPTIONS = [
  { value: "none", label: "No sort (default)" },
  { value: "most_popular", label: "Most popular" },
  { value: "alphabetical", label: "Alphabetical A–Z" },
  { value: "alphabetical_desc", label: "Alphabetical Z–A" },
  { value: "highest_rated", label: "Highest rating" },
  { value: "lowest_rated", label: "Lowest rating" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

type DiscoverSortOption = (typeof DISCOVER_SORT_OPTIONS)[number]["value"];

type SearchSortKey =
  | "none"
  | "most_popular"
  | "least_popular"
  | "highest_rated"
  | "lowest_rated"
  | "newest"
  | "oldest"
  | "alphabetical"
  | "alphabetical_desc";

const SORT_FALLBACKS: Record<string, DiscoverSortOption> = {
  popular_desc: "most_popular",
  popular_asc: "most_popular",
  rating_desc: "highest_rated",
  rating_asc: "lowest_rated",
  release_desc: "newest",
  release_asc: "oldest",
  none: "none",
};

const mapSortOrderToApiParam = (value: DiscoverSortOption): SearchSortKey => value as SearchSortKey;

const parsePlatformValue = (value: string | null): string => {
  if (!value) {
    return "all";
  }
  return value.trim() || "all";
};

const parsePageValue = (value: string | null): number => {
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseSortValue = (value: string | null): DiscoverSortOption => {
  const normalized = value?.trim();
  if (!normalized) {
    return "none";
  }
  if (SORT_FALLBACKS[normalized]) {
    return SORT_FALLBACKS[normalized];
  }
  return DISCOVER_SORT_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as DiscoverSortOption)
    : "none";
};

const DEFAULT_YEAR_RANGE: [number, number] = [1980, new Date().getFullYear()];

const AGE_RATING_LABELS: Record<number, string> = {
  1: "PEGI 3",
  2: "PEGI 7",
  3: "PEGI 12",
  4: "PEGI 16",
  5: "PEGI 18",
  6: "ESRB RP",
  7: "ESRB EC",
  8: "ESRB E",
  9: "ESRB E10+",
  10: "ESRB T",
  11: "ESRB M",
  12: "ESRB AO",
};

const parseNumberListParam = (raw: string | null): number[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => Number.parseInt(part, 10))
    .filter((num) => Number.isFinite(num));
};

const normalizeYearRange = (from?: number | null, to?: number | null): [number, number] => {
  const safeFrom = typeof from === "number" ? from : DEFAULT_YEAR_RANGE[0];
  const safeTo = typeof to === "number" ? to : DEFAULT_YEAR_RANGE[1];
  if (safeFrom > safeTo) {
    return [safeTo, safeFrom];
  }
  return [safeFrom, safeTo];
};

type IgdbListPlatform = { id?: number; name?: string | null; slug?: string | null; abbreviation?: string | null };
type IgdbListGame = {
  id: number;
  name: string;
  slug?: string | null;
  cover?: { image_id?: string | null } | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  platforms?: IgdbListPlatform[] | null;
  first_release_date?: number | null;
};

const HOMEPAGE_GRID =
  "grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2 sm:auto-cols-[45%] lg:auto-cols-[30%] xl:auto-cols-[25%]";

const mapIgdbListGame = (game: IgdbListGame): CardResult => {
  const coverUrl = igdbCoverUrl(game.cover?.image_id ?? null);
  const platforms = Array.isArray(game.platforms)
    ? game.platforms
        .map((platform) => ({
          id: platform?.id ?? 0,
          name: platform?.name ?? "Unknown",
          slug: platform?.slug ?? platform?.name ?? "",
          abbreviation: platform?.abbreviation ?? platform?.slug ?? platform?.name ?? undefined,
        }))
        .filter((p) => Boolean(p.name))
    : [];

  return {
    id: game.id,
    slug: game.slug ?? null,
    name: game.name,
    summary: "",
    cover: game.cover,
    coverUrl,
    coverImageUrl: coverUrl,
    screenshots: [],
    screenshotUrls: [],
    releaseYear: game.first_release_date
      ? new Date(Number(game.first_release_date) * 1000).getFullYear()
      : null,
    rating:
      typeof game.aggregated_rating === "number"
        ? game.aggregated_rating
        : typeof game.rating === "number"
          ? game.rating
          : null,
    ratingsCount: game.rating_count ?? 0,
    platforms,
    genres: [],
    popularity: null,
    first_release_date: game.first_release_date ?? null,
  } as CardResult & { first_release_date?: number | null };
};

const daysUntil = (timestamp: number | null | undefined): number | null => {
  if (!timestamp) return null;
  const today = new Date();
  const target = new Date(Number(timestamp) * 1000);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const daysSince = (timestamp: number | null | undefined): number | null => {
  if (!timestamp) return null;
  const today = new Date();
  const target = new Date(Number(timestamp) * 1000);
  const diff = today.getTime() - target.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatCountdown = (days: number | null) => {
  if (days === null) return null;
  if (days <= 0) return "Releasing soon";
  if (days === 1) return "Releases tomorrow";
  return `Releases in ${days} days`;
};

const formatDaysAgo = (days: number | null) => {
  if (days === null) return null;
  if (days <= 1) return "Released yesterday";
  return `Released ${days} days ago`;
};

  function DashboardPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const initialQueryParam = searchParams.get("q") ?? "";
    const initialPlatformParam = parsePlatformValue(searchParams.get("platform"));
    const initialPageParam = parsePageValue(searchParams.get("page"));
    const initialSortParam = parseSortValue(searchParams.get("sort"));
    const initialGenresParam = parseNumberListParam(searchParams.get("genres"));
    const initialThemesParam = parseNumberListParam(searchParams.get("themes"));
    const initialModesParam = parseNumberListParam(searchParams.get("gameModes"));
    const initialPerspectivesParam = parseNumberListParam(searchParams.get("playerPerspectives"));
    const initialAgeRatingsParam = parseNumberListParam(searchParams.get("ageRatings"));
    const initialReleaseFromParam = searchParams.get("releaseFrom");
    const initialReleaseToParam = searchParams.get("releaseTo");
    const initialReleaseRange = normalizeYearRange(
      initialReleaseFromParam ? Number.parseInt(initialReleaseFromParam, 10) : null,
      initialReleaseToParam ? Number.parseInt(initialReleaseToParam, 10) : null,
    );

    const { devices } = useDeviceStore();
    const { games, addGame, toggleWishlistGame, updateGame } = useGameStore();

    const trackedGames = Array.isArray(games) ? games : [];
    const trackedDevices = Array.isArray(devices) ? devices : [];

    const [query, setQuery] = useState(initialQueryParam);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQueryParam.trim());
    const [results, setResults] = useState<SearchResult[]>([]);
    const pageSize = 5;
    const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatformParam);
    const [sortOrder, setSortOrder] = useState<DiscoverSortOption>(initialSortParam);
    const [page, setPage] = useState(initialPageParam);
    const [pageInput, setPageInput] = useState(String(initialPageParam));
    const lastSyncedSearchRef = useRef(searchParams.toString());
    const skipPageResetRef = useRef(true);
    const filtersRef = useRef<HTMLDivElement | null>(null);
    const [pagination, setPagination] = useState(() => ({
      total: 0,
      page: initialPageParam,
      pageSize,
      hasNextPage: false,
      hasPreviousPage: false,
    }));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
    const [platformLoading, setPlatformLoading] = useState(true);
    const [platformError, setPlatformError] = useState<string | null>(null);
    const [platformSearch, setPlatformSearch] = useState("");
    const [genreOptions, setGenreOptions] = useState<SearchFilterOption[]>([]);
    const [themeOptions, setThemeOptions] = useState<SearchFilterOption[]>([]);
    const [gameModeOptions, setGameModeOptions] = useState<SearchFilterOption[]>([]);
    const [perspectiveOptions, setPerspectiveOptions] = useState<SearchFilterOption[]>([]);
    const [ageRatingOptions, setAgeRatingOptions] = useState<Array<{ rating: number; label: string; category?: number | null }>>(
      [],
    );
    const [selectedGenres, setSelectedGenres] = useState<number[]>(initialGenresParam);
    const [selectedThemes, setSelectedThemes] = useState<number[]>(initialThemesParam);
    const [selectedGameModes, setSelectedGameModes] = useState<number[]>(initialModesParam);
    const [selectedPerspectives, setSelectedPerspectives] = useState<number[]>(initialPerspectivesParam);
    const [selectedAgeRatings, setSelectedAgeRatings] = useState<number[]>(initialAgeRatingsParam);
    const [releaseYearRange, setReleaseYearRange] = useState<[number, number]>(initialReleaseRange);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [wishlistStatus, setWishlistStatus] = useState<{ message: string; tone: "success" | "info" | "error" } | null>(null);
    const [wishlistProcessingId, setWishlistProcessingId] = useState<number | null>(null);
    const [topGames, setTopGames] = useState<CardResult[]>([]);
    const [comingSoonGames, setComingSoonGames] = useState<CardResult[]>([]);
    const [recentGames, setRecentGames] = useState<CardResult[]>([]);
    const [headlineLoading, setHeadlineLoading] = useState(true);
    const safeResults = Array.isArray(results) ? results : [];
    const hasFilterSelection = useMemo(
      () =>
        selectedPlatform !== "all" ||
        selectedGenres.length > 0 ||
        selectedThemes.length > 0 ||
        selectedGameModes.length > 0 ||
        selectedPerspectives.length > 0 ||
        selectedAgeRatings.length > 0 ||
        releaseYearRange[0] !== DEFAULT_YEAR_RANGE[0] ||
        releaseYearRange[1] !== DEFAULT_YEAR_RANGE[1],
      [
        releaseYearRange,
        selectedAgeRatings,
        selectedGameModes,
        selectedGenres,
        selectedPerspectives,
        selectedPlatform,
        selectedThemes,
      ],
    );
    const activeFilterCount = useMemo(() => {
      let count = 0;
      if (selectedPlatform !== "all") count += 1;
      count += selectedGenres.length + selectedThemes.length + selectedGameModes.length + selectedPerspectives.length;
      count += selectedAgeRatings.length;
      if (releaseYearRange[0] !== DEFAULT_YEAR_RANGE[0] || releaseYearRange[1] !== DEFAULT_YEAR_RANGE[1]) {
        count += 1;
      }
      return count;
    }, [
      releaseYearRange,
      selectedAgeRatings,
      selectedGameModes,
      selectedGenres,
      selectedPerspectives,
      selectedPlatform,
      selectedThemes,
    ]);

  useEffect(() => {
    let cancelled = false;

    const fetchList = async (endpoint: string, limit: number): Promise<CardResult[]> => {
      try {
        const res = await fetch(endpoint, { method: "POST" });
        if (!res.ok) return [];
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        return list.slice(0, limit).map(mapIgdbListGame);
      } catch (error) {
        console.warn(`Failed to load ${endpoint}`, error);
        return [];
      }
    };

    const loadHeadlines = async () => {
      setHeadlineLoading(true);
      const [top, upcoming, recent] = await Promise.all([
        fetchList("/api/igdb/top100", 100),
        fetchList("/api/igdb/coming-soon", 20),
        fetchList("/api/igdb/recent", 20),
      ]);

      if (cancelled) return;
      setTopGames(top);
      setComingSoonGames(upcoming);
      setRecentGames(recent);
      setHeadlineLoading(false);
    };

    loadHeadlines();

    return () => {
      cancelled = true;
    };
  }, []);

    useEffect(() => {
      const currentSearch = searchParams.toString();
      if (currentSearch === lastSyncedSearchRef.current) {
        return;
      }

      const nextQueryParam = searchParams.get("q") ?? "";
      const nextPlatformParam = parsePlatformValue(searchParams.get("platform"));
      const nextPageParam = parsePageValue(searchParams.get("page"));
      const nextSortParam = parseSortValue(searchParams.get("sort"));
      const nextGenresParam = parseNumberListParam(searchParams.get("genres"));
      const nextThemesParam = parseNumberListParam(searchParams.get("themes"));
      const nextModesParam = parseNumberListParam(searchParams.get("gameModes"));
      const nextPerspectivesParam = parseNumberListParam(searchParams.get("playerPerspectives"));
      const nextAgeRatingsParam = parseNumberListParam(searchParams.get("ageRatings"));
      const nextReleaseRange = normalizeYearRange(
        searchParams.get("releaseFrom") ? Number.parseInt(searchParams.get("releaseFrom") ?? "", 10) : null,
        searchParams.get("releaseTo") ? Number.parseInt(searchParams.get("releaseTo") ?? "", 10) : null,
      );
      const trimmed = nextQueryParam.trim();

      setQuery((current) => (current === nextQueryParam ? current : nextQueryParam));
      setSelectedPlatform((current) => (current === nextPlatformParam ? current : nextPlatformParam));
      setPage((current) => (current === nextPageParam ? current : nextPageParam));
      setPageInput((current) => (current === String(nextPageParam) ? current : String(nextPageParam)));
      setDebouncedQuery((current) => (current === trimmed ? current : trimmed));
      setSortOrder((current) => (current === nextSortParam ? current : nextSortParam));
      setSelectedGenres(nextGenresParam);
      setSelectedThemes(nextThemesParam);
      setSelectedGameModes(nextModesParam);
      setSelectedPerspectives(nextPerspectivesParam);
      setSelectedAgeRatings(nextAgeRatingsParam);
      setReleaseYearRange(nextReleaseRange);

      skipPageResetRef.current = true;
      lastSyncedSearchRef.current = currentSearch;
    }, [searchParams]);

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
      let cancelled = false;

      setPlatformLoading(true);
      setPlatformError(null);

    fetch("/api/igdb/platforms")
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;
        if (!response.ok) {
          const message = (payload as { error?: string } | null)?.error ?? "Unable to load platforms.";
          throw new Error(message);
        }
        return payload;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        type ApiPlatform = {
          id: number;
          name: string;
          slug?: string | null;
          generation?: number | null;
          abbreviation?: string | null;
        };
        const rawList = Array.isArray((payload as { platforms?: ApiPlatform[] } | null)?.platforms)
          ? ((payload as { platforms: ApiPlatform[] }).platforms ?? [])
          : Array.isArray(payload)
            ? (payload as ApiPlatform[])
            : [];
        const normalized = rawList.map((platform) => ({
          id: platform.id,
          name: platform.name,
          slug: platform.slug ?? `igdb-${platform.id}`,
          yearStart: typeof platform.generation === "number" ? platform.generation : null,
          image: null,
          abbreviation: platform.abbreviation ?? null,
        }));
        const sorted = [...normalized].sort((a, b) => a.name.localeCompare(b.name));
        setPlatforms(sorted);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setPlatformError(fetchError instanceof Error ? fetchError.message : "Unable to load platforms.");
        setPlatforms([]);
      })
      .finally(() => {
        if (!cancelled) {
          setPlatformLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      let cancelled = false;

      fetch("/api/games/search?filters=options")
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as unknown;
          return payload as {
            genres?: SearchFilterOption[];
            themes?: SearchFilterOption[];
            gameModes?: SearchFilterOption[];
            playerPerspectives?: SearchFilterOption[];
            ageRatings?: IgdbAgeRating[];
          } | null;
        })
        .then((payload) => {
          if (cancelled || !payload) return;

          const normalize = (list?: SearchFilterOption[] | null) =>
            Array.isArray(list)
              ? list
                  .map((item) => ({ id: item.id, name: item.name ?? "", slug: item.slug ?? null }))
                  .filter((item) => Number.isFinite(item.id) && item.name)
              : [];

          setGenreOptions(normalize(payload.genres));
          setThemeOptions(normalize(payload.themes));
          setGameModeOptions(normalize(payload.gameModes));
          setPerspectiveOptions(normalize(payload.playerPerspectives));

          const ratings = Array.isArray(payload.ageRatings) ? payload.ageRatings : [];
          const uniqueRatings = Array.from(
            new Set(
              ratings
                .map((rating) => rating?.rating)
                .filter((rating): rating is number => typeof rating === "number"),
            ),
          );
          const mappedRatings = uniqueRatings.map((rating) => ({
            rating,
            label: AGE_RATING_LABELS[rating] ?? `Rating ${rating}`,
            category: (ratings.find((item) => item?.rating === rating) ?? {}).category ?? null,
          }));
          setAgeRatingOptions(mappedRatings);
        })
        .catch((error) => {
          if (cancelled) return;
          console.warn("Failed to load filter options", error);
        });

      return () => {
        cancelled = true;
      };
    }, []);

  useEffect(() => {
    if (!wishlistStatus) return;
    const timeout = window.setTimeout(() => setWishlistStatus(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [wishlistStatus]);

    useEffect(() => {
      const shouldFetch = Boolean(debouncedQuery) || hasFilterSelection;
      if (!shouldFetch) {
        setResults([]);
        setError(null);
        setLoading(false);
        setHasSearched(false);
        setPagination({
        total: 0,
        page: 1,
        pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      if (page !== 1) {
        setPage(1);
      }
      return;
      }

      const controller = new AbortController();
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const apiParams = new URLSearchParams();
      if (debouncedQuery) {
        apiParams.set("q", debouncedQuery);
      }
      if (selectedPlatform !== "all") {
        apiParams.set("platformId", selectedPlatform);
      }
      if (selectedGenres.length) {
        apiParams.set("genres", selectedGenres.join(","));
      }
      if (selectedThemes.length) {
        apiParams.set("themes", selectedThemes.join(","));
      }
      if (selectedGameModes.length) {
        apiParams.set("gameModes", selectedGameModes.join(","));
      }
      if (selectedPerspectives.length) {
        apiParams.set("playerPerspectives", selectedPerspectives.join(","));
      }
      if (selectedAgeRatings.length) {
        apiParams.set("ageRatings", selectedAgeRatings.join(","));
      }
      if (releaseYearRange[0] !== DEFAULT_YEAR_RANGE[0]) {
        apiParams.set("releaseFrom", String(releaseYearRange[0]));
      }
      if (releaseYearRange[1] !== DEFAULT_YEAR_RANGE[1]) {
        apiParams.set("releaseTo", String(releaseYearRange[1]));
      }
      if (sortOrder !== "none") {
        const apiSortParam = mapSortOrderToApiParam(sortOrder);
        apiParams.set("sort", apiSortParam);
      }
      apiParams.set("page", String(page));
      apiParams.set("pageSize", String(pageSize));
      const searchPath = apiParams.toString();

    fetch(`/api/games/search${searchPath ? `?${searchPath}` : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;
        if (!response.ok) {
          const message = (payload as { error?: string } | null)?.error ?? "Unable to search games.";
          throw new Error(message);
        }
        return payload;
      })
      .then((payload) => {
        const data = payload as Partial<SearchResponse> | null;
        const normalizedResults = Array.isArray(data?.results) ? (data.results as SearchResult[]) : [];
        setResults(normalizedResults);
        const nextPagination = {
          total: typeof data?.pagination?.total === "number" ? data.pagination.total : normalizedResults.length,
          page:
            typeof data?.pagination?.page === "number" && data.pagination.page > 0 ? data.pagination.page : page,
          pageSize:
            typeof data?.pagination?.pageSize === "number" && data.pagination.pageSize > 0
              ? data.pagination.pageSize
              : pageSize,
          hasNextPage: Boolean(data?.pagination?.hasNextPage),
          hasPreviousPage: Boolean(data?.pagination?.hasPreviousPage),
        };
        setPagination(nextPagination);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error searching games.");
        setResults([]);
        setPagination({
          total: 0,
          page: 1,
          pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        if (page !== 1) {
          setPage(1);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
    }, [debouncedQuery, selectedPlatform, page, pageSize, sortOrder, selectedGenres, selectedThemes, selectedGameModes, selectedPerspectives, selectedAgeRatings, releaseYearRange]);

    useEffect(() => {
      if (skipPageResetRef.current) {
        skipPageResetRef.current = false;
        return;
      }
      setPage(1);
    }, [debouncedQuery, selectedPlatform, sortOrder, selectedGenres, selectedThemes, selectedGameModes, selectedPerspectives, selectedAgeRatings, releaseYearRange]);

  useEffect(() => {
    const nextValue = String(pagination.page > 0 ? pagination.page : page);
    setPageInput((current) => (current === nextValue ? current : nextValue));
  }, [page, pagination.page]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
      if (selectedPlatform !== "all") {
        params.set("platform", selectedPlatform);
      }
      if (selectedGenres.length) {
        params.set("genres", selectedGenres.join(","));
      } else {
        params.delete("genres");
      }
      if (selectedThemes.length) {
        params.set("themes", selectedThemes.join(","));
      } else {
        params.delete("themes");
      }
      if (selectedGameModes.length) {
        params.set("gameModes", selectedGameModes.join(","));
      } else {
        params.delete("gameModes");
      }
      if (selectedPerspectives.length) {
        params.set("playerPerspectives", selectedPerspectives.join(","));
      } else {
        params.delete("playerPerspectives");
      }
      if (selectedAgeRatings.length) {
        params.set("ageRatings", selectedAgeRatings.join(","));
      } else {
        params.delete("ageRatings");
      }
      if (releaseYearRange[0] !== DEFAULT_YEAR_RANGE[0]) {
        params.set("releaseFrom", String(releaseYearRange[0]));
      } else {
        params.delete("releaseFrom");
      }
      if (releaseYearRange[1] !== DEFAULT_YEAR_RANGE[1]) {
        params.set("releaseTo", String(releaseYearRange[1]));
      } else {
        params.delete("releaseTo");
      }
      if (page > 1) {
        params.set("page", String(page));
      }
      if (sortOrder !== "none") {
        params.set("sort", sortOrder);
      }

    const nextSearch = params.toString();
    if (nextSearch === lastSyncedSearchRef.current) {
      return;
    }

    lastSyncedSearchRef.current = nextSearch;
    router.replace(`${pathname}${nextSearch ? `?${nextSearch}` : ""}`, { scroll: false });
    }, [debouncedQuery, selectedPlatform, sortOrder, page, pathname, router, selectedGenres, selectedThemes, selectedGameModes, selectedPerspectives, selectedAgeRatings, releaseYearRange]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPage(1);
      setDebouncedQuery(query.trim());
    };

    const handlePlatformChange = (value: string) => {
      setPage(1);
      setSelectedPlatform(value);
    };

    const handleResetFilters = () => {
      setSelectedPlatform("all");
      setSortOrder("none");
      setSelectedGenres([]);
      setSelectedThemes([]);
      setSelectedGameModes([]);
      setSelectedPerspectives([]);
      setSelectedAgeRatings([]);
      setReleaseYearRange([...DEFAULT_YEAR_RANGE]);
      setPage(1);
      setPageInput("1");
      setFiltersOpen(false);
    };

  const statusCounts = statusLabels.map((status) => ({
    status,
    count: trackedGames.filter((game) => game.status === status).length,
  }));

  const filteredPlatforms = useMemo(() => {
    const availablePlatforms = Array.isArray(platforms) ? platforms : [];
    if (!platformSearch.trim()) {
      return availablePlatforms;
    }
    const term = platformSearch.trim().toLowerCase();
    return availablePlatforms.filter((platform) => platform.name.toLowerCase().includes(term));
  }, [platformSearch, platforms]);

  const selectedPlatformId = selectedPlatform !== "all" ? Number.parseInt(selectedPlatform, 10) : null;

  const sortedPlatforms = useMemo(() => {
    const normalized = Array.isArray(filteredPlatforms) ? filteredPlatforms : [];
    return [...normalized].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPlatforms]);

    const platformButtons = sortedPlatforms;

    const sortedGenreOptions = useMemo(
      () => [...genreOptions].sort((a, b) => a.name.localeCompare(b.name)),
      [genreOptions],
    );
    const sortedThemeOptions = useMemo(
      () => [...themeOptions].sort((a, b) => a.name.localeCompare(b.name)),
      [themeOptions],
    );
    const sortedGameModeOptions = useMemo(
      () => [...gameModeOptions].sort((a, b) => a.name.localeCompare(b.name)),
      [gameModeOptions],
    );
    const sortedPerspectiveOptions = useMemo(
      () => [...perspectiveOptions].sort((a, b) => a.name.localeCompare(b.name)),
      [perspectiveOptions],
    );
    const sortedAgeRatingOptions = useMemo(
      () => [...ageRatingOptions].sort((a, b) => a.label.localeCompare(b.label)),
      [ageRatingOptions],
    );

  const retroPrioritySlugs = [
    "nes",
    "snes",
    "nintendo-64",
    "gamecube",
    "playstation",
    "playstation2",
    "game-boy",
    "game-boy-advance",
    "sega-genesis",
    "dreamcast",
  ];

  const retroPlatforms = useMemo(() => {
    if (!platforms.length) {
      return [] as PlatformOption[];
    }

    const prioritized = retroPrioritySlugs
      .map((slug) => platforms.find((platform) => platform.slug === slug))
      .filter((platform): platform is PlatformOption => Boolean(platform));

    const fallback = platforms
      .filter(
        (platform) =>
          !prioritized.some((item) => item.id === platform.id) &&
          (platform.yearStart ? platform.yearStart < 2005 : false),
      )
      .slice(0, 6);

    return [...prioritized, ...fallback].slice(0, 8);
  }, [platforms]);

  const totalGames = trackedGames.length || 1;
  const recentLibraryGames = [...trackedGames]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const playingGames = trackedGames.filter((game) => game.status === "playing");
  const wishlistGames = trackedGames.filter((game) => game.wishlist);
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(pagination.total, safeResults.length) / Math.max(pagination.pageSize, 1)),
  );
  const currentPage = pagination.page > 0 ? pagination.page : page;
  const canGoNext = pagination.hasNextPage || currentPage < totalPages;
  const canGoPrevious = pagination.hasPreviousPage || currentPage > 1;
  const isPageJumpDisabled = totalPages <= 1;

  const handlePageJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPageJumpDisabled) {
      return;
    }

    const trimmed = pageInput.trim();
    if (!trimmed) {
      setPageInput(String(currentPage));
      return;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }

    const normalized = Math.min(totalPages, Math.max(1, parsed));
    setPage(normalized);
  };

  const fetchDetailMetadata = async (id: number): Promise<DetailMetadata> => {
    const response = await fetch(`/api/games/${id}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const message =
        (payload as { error?: string } | null)?.error ?? "Tidak dapat memuat detail game dari IGDB.";
      throw new Error(message);
    }
    return payload as DetailMetadata;
  };

  const handleAddToWishlist = async (game: SearchResult) => {
    const normalizedTitle = game.name.trim().toLowerCase();
    const existing = trackedGames.find((item) => item.title.trim().toLowerCase() === normalizedTitle);

    if (existing) {
      if (existing.wishlist) {
        setWishlistStatus({ message: `${game.name} sudah ada di wishlist kamu.`, tone: "info" });
        return;
      }

      setWishlistProcessingId(game.id);

      const needsMetadata =
        !existing.igdbId || !existing.coverImage || !existing.heroImage || !existing.screenshotUrls?.length;

      let detail: DetailMetadata | null = null;
      let detailError: Error | null = null;

      if (needsMetadata) {
        try {
          detail = await fetchDetailMetadata(game.id);
        } catch (error) {
          detailError = error instanceof Error ? error : new Error("Gagal mengambil metadata tambahan.");
          console.error(error);
        }
      }

      try {
        toggleWishlistGame(existing.id);
        const detailScreenshots = detail?.screenshotUrls?.length
          ? detail.screenshotUrls
          : detail?.gallery
              ?.map((shot) => shot?.url?.trim())
              .filter((url): url is string => Boolean(url)) ?? [];
        const fallbackScreenshots = detailScreenshots.length
          ? detailScreenshots
          : getResultScreenshots(game);

        const updates: Partial<Game> = {};
        if (!existing.igdbId) {
          updates.igdbId = detail?.id ?? game.id;
        }
        const preferredThumbnail = detail?.thumbnail ?? detail?.coverImageUrl ?? getResultCover(game);
        if (preferredThumbnail && !existing.coverImage) {
          updates.coverImage = preferredThumbnail;
        }
        const preferredHero = detail?.backgroundImage ?? preferredThumbnail ?? null;
        if (preferredHero && !existing.heroImage) {
          updates.heroImage = preferredHero;
        }
        if (fallbackScreenshots.length && (!existing.screenshotUrls || existing.screenshotUrls.length === 0)) {
          updates.screenshotUrls = fallbackScreenshots;
        }

        if (Object.keys(updates).length > 0) {
          updateGame(existing.id, updates);
        }

        const tone = detailError ? "info" : "success";
        const message = detailError
          ? `${game.name} ditambahkan ke wishlist, metadata tambahan belum lengkap.`
          : `${game.name} dipindahkan ke wishlist kamu.`;
        setWishlistStatus({ message, tone });
      } catch (error) {
        console.error(error);
        setWishlistStatus({
          message: `Terjadi kesalahan saat memproses ${game.name}.`,
          tone: "error",
        });
      } finally {
        setWishlistProcessingId(null);
      }
      return;
    }

    setWishlistProcessingId(game.id);

    let detail: DetailMetadata | null = null;
    let detailError: Error | null = null;

    try {
      detail = await fetchDetailMetadata(game.id);
    } catch (error) {
      detailError = error instanceof Error ? error : new Error("Gagal mengambil metadata tambahan.");
      console.error(error);
    }

    try {
      const normalizedPlatforms = game.platforms ?? [];
      const primaryPlatform = normalizedPlatforms[0];
      const platformName = primaryPlatform?.name ?? "Unassigned platform";
      const platformIdentifier = primaryPlatform ? `igdb:${primaryPlatform.id}` : "igdb:unassigned";
      const detailScreenshots = detail?.screenshotUrls?.length
        ? detail.screenshotUrls
        : detail?.gallery
            ?.map((shot) => shot?.url?.trim())
            .filter((url): url is string => Boolean(url)) ?? [];
      const fallbackScreenshots = detailScreenshots.length ? detailScreenshots : getResultScreenshots(game);

      addGame({
        title: game.name,
        platformId: platformIdentifier,
        platformName,
        status: "backlog",
        format: "digital",
        source: "IGDB",
        fileName: game.name,
        folderPath: primaryPlatform?.slug,
        emulatorCore: undefined,
        shaderPreset: undefined,
        region: undefined,
        tags: normalizedPlatforms.map((platform) => platform.name).filter(Boolean),
        rating: game.rating ?? undefined,
        hoursPlayed: undefined,
        lastPlayedAt: undefined,
        notes: `Wishlist entry imported from IGDB on ${new Date().toLocaleDateString()}.`,
        favorite: false,
        wishlist: true,
        igdbId: detail?.id ?? game.id,
        coverImage: (detail?.thumbnail ?? detail?.coverImageUrl ?? getResultCover(game)) ?? undefined,
        heroImage:
          (detail?.backgroundImage ?? detail?.thumbnail ?? detail?.coverImageUrl ?? getResultCover(game)) ?? undefined,
        screenshotUrls: fallbackScreenshots.length ? fallbackScreenshots : undefined,
      });

      const tone = detailError ? "info" : "success";
      const message = detailError
        ? `${game.name} ditambahkan ke wishlist tanpa metadata lengkap.`
        : `${game.name} berhasil ditambahkan ke wishlist.`;
      setWishlistStatus({ message, tone });
    } catch (error) {
      console.error(error);
      setWishlistStatus({
        message: `Terjadi kesalahan saat menambahkan ${game.name} ke wishlist.`,
        tone: "error",
      });
    } finally {
      setWishlistProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Discover Games</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Telusuri rilisan terbaik, game yang akan datang, dan acara menarik berbasis data IGDB.
        </p>
      </div>

      <div className="space-y-6">
        <Card title="Top 100 Games">
          {headlineLoading && !topGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/70 shadow-inner shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/60"
                />
              ))}
            </div>
          ) : topGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {topGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">No data available.</p>
          )}
        </Card>

        <Card title="Coming Soon" description="Releases ordered by date">
          {headlineLoading && !comingSoonGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/70 shadow-inner shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/60"
                />
              ))}
            </div>
          ) : comingSoonGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {comingSoonGames.map((game) => {
                const releaseTimestamp = (game as { first_release_date?: number | null }).first_release_date ?? null;
                const label = formatCountdown(daysUntil(releaseTimestamp));
                return (
                  <div key={game.id} className="space-y-2">
                    <GameCard game={game} />
                    {label ? <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">No upcoming releases found.</p>
          )}
        </Card>

        <Card title="Recently Released" description="Latest launches in the past 90 days">
          {headlineLoading && !recentGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/70 shadow-inner shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/60"
                />
              ))}
            </div>
          ) : recentGames.length ? (
            <div className={HOMEPAGE_GRID}>
              {recentGames.map((game) => {
                const releaseTimestamp = (game as { first_release_date?: number | null }).first_release_date ?? null;
                const ago = formatDaysAgo(daysSince(releaseTimestamp));
                return (
                  <div key={game.id} className="space-y-2">
                    <GameCard game={game} />
                    {ago ? <p className="text-sm text-slate-600 dark:text-slate-300">{ago}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">No recent releases found.</p>
          )}
        </Card>

        <EventsSection />
      </div>

      <Card
        title="Discover games"
        description="Search the IGDB database, filter by console, and save wishlist ideas instantly."
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_auto]">
            <div className="relative min-w-0">
              <label htmlFor="dashboard-search" className="sr-only">
                Search games
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="dashboard-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul game dari IGDB..."
                className="w-full rounded-xl border border-slate-200 bg-white/95 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="dashboard-platform"
                className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
              >
                Console / platform
              </label>
              <select
                id="dashboard-platform"
                value={selectedPlatform}
                onChange={(event) => handlePlatformChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">Semua platform</option>
                {platformLoading ? (
                  <option value="loading" disabled>
                    Memuat daftar platform...
                  </option>
                ) : platformButtons.length ? (
                  platformButtons.map((platform) => (
                    <option key={platform.id} value={String(platform.id)}>
                      {platform.name}
                    </option>
                  ))
                ) : (
                  <option value="empty" disabled>
                    Platform tidak ditemukan
                  </option>
                )}
              </select>
              <div className="relative">
                <label htmlFor="dashboard-platform-search" className="sr-only">
                  Filter platform
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="dashboard-platform-search"
                  type="search"
                  value={platformSearch}
                  onChange={(event) => setPlatformSearch(event.target.value)}
                  placeholder="Cari nama console (PS2, SNES, GBA...)"
                  className="w-full rounded-xl border border-slate-200 bg-white/95 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex w-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 sm:w-64">
              Sort results
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as DiscoverSortOption)}
                className="h-11 rounded-xl border border-slate-200 bg-white/95 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {DISCOVER_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden items-center gap-3 sm:flex">
              {hasFilterSelection ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {activeFilterCount} filter aktif
                </span>
              ) : null}
              <FiltersResetButton onReset={handleResetFilters} />
            </div>
          </div>

          <div className="sticky top-2 z-20 md:hidden">
            <div className="flex items-center justify-between gap-3 rounded-full border border-slate-200/80 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-100 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-700">
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen((prev) => !prev);
                  filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-2"
              >
                {filtersOpen ? "Sembunyikan filter" : "Filter pencarian"}
                {hasFilterSelection ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>

          <div
            ref={filtersRef}
            className={`${filtersOpen ? "block" : "hidden"} md:block space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Refine search</p>
                {hasFilterSelection ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {activeFilterCount} aktif
                  </span>
                ) : null}
              </div>
              <div className="hidden md:block">
                <FiltersResetButton onReset={handleResetFilters} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <GenreFilter options={sortedGenreOptions} value={selectedGenres} onChange={setSelectedGenres} defaultOpen />
              <ThemeFilter options={sortedThemeOptions} value={selectedThemes} onChange={setSelectedThemes} />
              <GameModeFilter options={sortedGameModeOptions} value={selectedGameModes} onChange={setSelectedGameModes} />
              <PerspectiveFilter
                options={sortedPerspectiveOptions}
                value={selectedPerspectives}
                onChange={setSelectedPerspectives}
              />
              <AgeRatingFilter options={sortedAgeRatingOptions} value={selectedAgeRatings} onChange={setSelectedAgeRatings} />
              <YearRangePicker
                value={releaseYearRange}
                onChange={setReleaseYearRange}
                minYear={DEFAULT_YEAR_RANGE[0]}
                maxYear={DEFAULT_YEAR_RANGE[1]}
                defaultOpen
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-xl bg-slate-100/60 p-2 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => handlePlatformChange("all")}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${selectedPlatform === "all" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-white/80 text-slate-600 hover:bg-emerald-500/10 dark:bg-slate-900/70 dark:text-slate-300"}`}
              aria-pressed={selectedPlatform === "all"}
            >
              Semua
            </button>
            {retroPlatforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformChange(String(platform.id))}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${selectedPlatformId === platform.id ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-white/80 text-slate-600 hover:bg-emerald-500/10 dark:bg-slate-900/70 dark:text-slate-300"}`}
                aria-pressed={selectedPlatformId === platform.id}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </form>

        {platformError ? (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{platformError}</p>
        ) : null}

        {wishlistStatus ? (
          <div
            role="status"
            className={`mt-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
              wishlistStatus.tone === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : wishlistStatus.tone === "info"
                ? "border-amber-500/40 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-rose-500/40 bg-rose-100 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            }`}
          >
            {wishlistStatus.message}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mencari game di IGDB...
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          {!loading && !error && hasSearched && safeResults.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada game yang cocok. Coba judul atau console lain.</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {safeResults.map((game) => {
              const normalizedTitle = game.name.trim().toLowerCase();
              const existing = trackedGames.find((item) => item.title.trim().toLowerCase() === normalizedTitle);
              const isWishlisted = Boolean(existing?.wishlist);
              const isProcessing = wishlistProcessingId === game.id;
              const normalizedPlatforms = game.platforms ?? [];
              const detailQuery: Record<string, string> = {};
              if (debouncedQuery) {
                detailQuery.q = debouncedQuery;
              }
              if (selectedPlatform !== "all") {
                detailQuery.platform = selectedPlatform;
              }
              if (currentPage > 1) {
                detailQuery.page = String(currentPage);
              }
              const detailHref = {
                pathname: `/games/${game.id}`,
                query: detailQuery,
              } as const;

              const coverImageId = (game as { cover?: { image_id?: string | null } | null })?.cover?.image_id ?? null;
              const compactData = {
                id: game.id,
                name: game.name,
                coverImageId: coverImageId ?? undefined,
                coverUrl: getResultCover(game) ?? undefined,
                rating: game.rating,
                ratingsCount: game.ratingsCount,
                releaseYear: game.releaseYear ?? undefined,
                platforms: normalizedPlatforms.map((platform) => ({
                  id: platform.id,
                  name: platform.name,
                  abbreviation: platform.abbreviation ?? platform.slug ?? platform.name,
                })),
              } satisfies Parameters<typeof GameCardCompact>[0]["game"];

              return (
                <div key={game.id} className="space-y-2">
                  <GameCardCompact
                    game={compactData}
                    actionLabel={isWishlisted ? "Sudah di wishlist" : "Tambah ke wishlist"}
                    actionDisabled={isWishlisted}
                    actionBusy={isProcessing}
                    onAction={() => handleAddToWishlist(game)}
                    footer={
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:focus-visible:ring-offset-slate-900"
                      >
                        Lihat detail & trailer
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    }
                  />
                </div>
              );
            })}
          </div>
          
          {(pagination.total > pagination.pageSize || pagination.hasNextPage || pagination.hasPreviousPage) && (
            <nav
              aria-label="IGDB search pagination"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
            >
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
              <form
                onSubmit={handlePageJump}
                className="flex items-center gap-2"
              >
                <label htmlFor="pagination-page-input" className="sr-only">
                  Masukkan nomor halaman
                </label>
                <input
                  id="pagination-page-input"
                  type="number"
                  min={1}
                  max={totalPages}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  disabled={isPageJumpDisabled}
                  className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isPageJumpDisabled}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/90 px-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:focus-visible:ring-offset-slate-900"
                >
                  Ke halaman
                </button>
              </form>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={!canGoPrevious}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-semibold transition ${
                    !canGoPrevious
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
                      : "border-slate-300 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!canGoNext}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-semibold transition ${
                    !canGoNext
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
                      : "border-emerald-500/40 bg-emerald-500/90 text-white hover:-translate-y-0.5 hover:border-emerald-400 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100"
                  }`}
                >
                  Selanjutnya
                </button>
              </div>
            </nav>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card title="Devices" description="Tracked consoles & devices">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{trackedDevices.length}</p>
        </Card>
        <Card title="Games" description="Total items in your library">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{trackedGames.length}</p>
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
            {recentLibraryGames.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No games added yet.</p>
            ) : (
              recentLibraryGames.map((game) => (
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
            {trackedDevices.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Add your first device to begin tracking.</p>
            ) : (
              trackedDevices
                .map((device) => ({
                  device,
                  count: trackedGames.filter((game) => game.platformId === device.id).length,
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500 dark:text-slate-400">Memuat dashboard…</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
