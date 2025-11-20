"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, Star } from "lucide-react";
import { Card } from "@/components/Card";
import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { igdbCoverUrl, igdbScreenshotUrl } from "@/lib/igdbImages";
import { formatDateTime } from "@/lib/utils";
import { GameStatus, Game } from "@/lib/types";

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
  cover?: { image_id?: string | null } | null;
  coverUrl: string | null;
  coverImageUrl?: string | null;
  coverImageId?: string | null;
  screenshots: string[];
  screenshotUrls?: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
  genres: string[];
};

const getResultCover = (game: SearchResult | null | undefined): string | null => {
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

const getResultScreenshots = (game: SearchResult | null | undefined): string[] => {
  if (!game) {
    return [];
  }

  const rawScreens = (game as any)?.screenshots;
  if (Array.isArray(rawScreens) && rawScreens.length) {
    const resolved = rawScreens
      .map((shot: any) => {
        const id = shot?.image_id ?? null;
        return id ? igdbScreenshotUrl(id) : typeof shot === "string" ? shot : null;
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

const normalizePlatform = (platform: SearchPlatform | null | undefined): SearchPlatform | null => {
  if (!platform) return null;
  const name = typeof platform.name === "string" ? platform.name : String(platform.id ?? "").trim();
  const slug = typeof platform.slug === "string" && platform.slug.trim().length ? platform.slug : name.toLowerCase();
  return {
    id: platform.id,
    name,
    slug,
    abbreviation: platform.abbreviation ?? null,
  };
};

const normalizeSearchResult = (result: SearchResult | (SearchResult & { cover?: { image_id?: string | null } }) | any):
  SearchResult => {
  const coverId = result?.cover?.image_id ?? result?.coverImageId ?? null;
  const coverUrl = igdbCoverUrl(coverId) ?? result.coverUrl ?? result.coverImageUrl ?? null;
  const screenshots = getResultScreenshots(result);
  const releaseYear = typeof result.releaseYear === "number"
    ? result.releaseYear
    : result.first_release_date
      ? new Date(Number(result.first_release_date) * 1000).getFullYear()
      : null;
  const platforms = Array.isArray(result.platforms)
    ? result.platforms
        .map((platform: SearchPlatform | null | undefined) => normalizePlatform(platform))
        .filter(
          (platform: SearchPlatform | null | undefined): platform is SearchPlatform =>
            Boolean(platform)
        )
    : [];

  return {
    ...result,
    cover: result?.cover ?? (coverId ? { image_id: coverId } : null),
    coverUrl,
    coverImageUrl: coverUrl ?? result.coverImageUrl ?? null,
    coverImageId: coverId,
    screenshots,
    screenshotUrls: screenshots,
    releaseYear,
    platforms,
  } as SearchResult;
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
  { value: "highest_rated", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "A → Z" },
] as const;

type DiscoverSortOption = (typeof DISCOVER_SORT_OPTIONS)[number]["value"];

const mapSortOrderToApiParam = (value: DiscoverSortOption): string => value;

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
  if (!value) {
    return "none";
  }
  return DISCOVER_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as DiscoverSortOption)
    : "none";
};

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQueryParam = searchParams.get("q") ?? "";
  const initialPlatformParam = parsePlatformValue(searchParams.get("platform"));
  const initialPageParam = parsePageValue(searchParams.get("page"));
  const initialSortParam = parseSortValue(searchParams.get("sort"));

  const { devices } = useDeviceStore();
  const { games, addGame, toggleWishlistGame, updateGame } = useGameStore();

  const trackedGames = Array.isArray(games) ? games : [];
  const trackedDevices = Array.isArray(devices) ? devices : [];

  const [query, setQuery] = useState(initialQueryParam);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQueryParam.trim());
  const [results, setResults] = useState<SearchResult[]>([]);
  const pageSize = 6;
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatformParam);
  const [sortOrder, setSortOrder] = useState<DiscoverSortOption>(initialSortParam);
  const [page, setPage] = useState(initialPageParam);
  const [pageInput, setPageInput] = useState(String(initialPageParam));
  const lastSyncedSearchRef = useRef(searchParams.toString());
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
  const [wishlistStatus, setWishlistStatus] = useState<{ message: string; tone: "success" | "info" | "error" } | null>(null);
  const [wishlistProcessingId, setWishlistProcessingId] = useState<number | null>(null);
  const safeResults = Array.isArray(results) ? results : [];

  useEffect(() => {
    const currentSearch = searchParams.toString();
    if (currentSearch === lastSyncedSearchRef.current) {
      return;
    }

    const nextQueryParam = searchParams.get("q") ?? "";
    const nextPlatformParam = parsePlatformValue(searchParams.get("platform"));
    const nextPageParam = parsePageValue(searchParams.get("page"));
    const nextSortParam = parseSortValue(searchParams.get("sort"));
    const trimmed = nextQueryParam.trim();

    setQuery((current) => (current === nextQueryParam ? current : nextQueryParam));
    setSelectedPlatform((current) => (current === nextPlatformParam ? current : nextPlatformParam));
    setPage((current) => (current === nextPageParam ? current : nextPageParam));
    setPageInput((current) => (current === String(nextPageParam) ? current : String(nextPageParam)));
    setDebouncedQuery((current) => (current === trimmed ? current : trimmed));
    setSortOrder((current) => (current === nextSortParam ? current : nextSortParam));

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
    if (!wishlistStatus) return;
    const timeout = window.setTimeout(() => setWishlistStatus(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [wishlistStatus]);

  useEffect(() => {
    const shouldFetch = Boolean(debouncedQuery) || selectedPlatform !== "all";
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

    fetch(`/api/games/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: debouncedQuery,
        sort: mapSortOrderToApiParam(sortOrder),
        platform: selectedPlatform,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;
        return payload;
      })
      .then((payload) => {
        const data = payload as Partial<SearchResponse> | null;
        const normalizedResults = (Array.isArray(data?.results)
          ? (data.results as SearchResult[])
          : Array.isArray((data as any)?.games)
            ? ((data as any).games as SearchResult[])
            : [])
          .map((result) => normalizeSearchResult(result));
        if ((data as { error?: string } | null)?.error) {
          setError((data as { error?: string }).error ?? null);
        }
        setResults(normalizedResults);
        setPagination({
          total: normalizedResults.length,
          page: 1,
          pageSize,
          hasNextPage: normalizedResults.length > pageSize,
          hasPreviousPage: false,
        });
        setPage(1);
        setPageInput("1");
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
  }, [debouncedQuery, selectedPlatform, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedPlatform, sortOrder]);

  useEffect(() => {
    const nextValue = String(Math.max(1, page));
    setPageInput((current) => (current === nextValue ? current : nextValue));
  }, [page]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
    if (selectedPlatform !== "all") {
      params.set("platform", selectedPlatform);
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
  }, [debouncedQuery, selectedPlatform, sortOrder, page, pathname, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setDebouncedQuery(query.trim());
  };

  const handlePlatformChange = (value: string) => {
    setPage(1);
    setSelectedPlatform(value);
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
  const recentGames = [...trackedGames]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const playingGames = trackedGames.filter((game) => game.status === "playing");
  const wishlistGames = trackedGames.filter((game) => game.wishlist);
  const totalResults = Math.max(pagination.total, safeResults.length);
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));
  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;
  const isPageJumpDisabled = totalPages <= 1;
  const paginatedResults = safeResults.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: totalResults,
      page: currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    }));
  }, [currentPage, totalPages, totalResults, pageSize]);

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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
            {paginatedResults.map((game) => {
              const normalizedTitle = game.name.trim().toLowerCase();
              const existing = trackedGames.find((item) => item.title.trim().toLowerCase() === normalizedTitle);
              const isWishlisted = Boolean(existing?.wishlist);
              const isProcessing = wishlistProcessingId === game.id;
              const normalizedPlatforms = game.platforms ?? [];
              const coverId = game.cover?.image_id ?? game.coverImageId ?? null;
              const coverUrl = igdbCoverUrl(coverId) ?? getResultCover(game);
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

              const cardData: CompactGameCardData = {
                id: game.id,
                name: game.name,
                coverImageId: coverId,
                coverUrl,
                rating: game.rating ?? null,
                ratingsCount: game.ratingsCount ?? null,
                releaseYear: game.releaseYear ?? null,
                platforms: normalizedPlatforms.map((platform) => ({
                  id: platform.id,
                  name: platform.name,
                  abbreviation: platform.abbreviation ?? null,
                })),
              };

              return (
                <GameCardCompact
                  key={game.id}
                  game={cardData}
                  actionLabel={
                    isProcessing
                      ? "Memproses..."
                      : isWishlisted
                        ? "Sudah di wishlist"
                        : "Tambah ke wishlist"
                  }
                  onAction={() => handleAddToWishlist(game)}
                  actionDisabled={isWishlisted || isProcessing}
                  actionBusy={isProcessing}
                  footer={
                    <Link
                      href={detailHref}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      Lihat detail & trailer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
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
