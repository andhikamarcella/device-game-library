"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Clapperboard, Loader2, Search, Star, X } from "lucide-react";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { formatDateTime } from "@/lib/utils";
import { GameStatus, Game } from "@/lib/types";

type SearchPlatform = {
  id: number;
  name: string;
  slug: string;
};

type SearchResult = {
  id: number;
  name: string;
  coverImage: string | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
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
  thumbnail: string | null;
  backgroundImage: string | null;
  gallery: Array<{ id: number; url: string | null }>;
};

type TrailerPreview = {
  id: number;
  name: string;
  preview: string | null;
  data: Record<string, string | undefined>;
};

type GameplayPreview = {
  videoId: string;
  title: string;
  channelTitle: string;
};

type PlatformOption = {
  id: number;
  name: string;
  slug: string;
  yearStart: number | null;
  image: string | null;
};

const statusLabels: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

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

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQueryParam = searchParams.get("q") ?? "";
  const initialPlatformParam = parsePlatformValue(searchParams.get("platform"));
  const initialPageParam = parsePageValue(searchParams.get("page"));

  const { devices } = useDeviceStore();
  const { games, addGame, toggleWishlistGame, updateGame } = useGameStore();

  const [query, setQuery] = useState(initialQueryParam);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQueryParam.trim());
  const [results, setResults] = useState<SearchResult[]>([]);
  const pageSize = 6;
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatformParam);
  const [page, setPage] = useState(initialPageParam);
  const [pageInput, setPageInput] = useState(String(initialPageParam));
  const lastSyncedSearchRef = useRef(searchParams.toString());
  const skipPageResetRef = useRef(true);
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
  const [mediaPreview, setMediaPreview] = useState<{ gameId: number; title: string } | null>(null);
  const [mediaTrailers, setMediaTrailers] = useState<TrailerPreview[]>([]);
  const [mediaVideos, setMediaVideos] = useState<GameplayPreview[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    const currentSearch = searchParams.toString();
    if (currentSearch === lastSyncedSearchRef.current) {
      return;
    }

    const nextQueryParam = searchParams.get("q") ?? "";
    const nextPlatformParam = parsePlatformValue(searchParams.get("platform"));
    const nextPageParam = parsePageValue(searchParams.get("page"));
    const trimmed = nextQueryParam.trim();

    setQuery((current) => (current === nextQueryParam ? current : nextQueryParam));
    setSelectedPlatform((current) => (current === nextPlatformParam ? current : nextPlatformParam));
    setPage((current) => (current === nextPageParam ? current : nextPageParam));
    setPageInput((current) => (current === String(nextPageParam) ? current : String(nextPageParam)));
    setDebouncedQuery((current) => (current === trimmed ? current : trimmed));

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

    fetch("/api/platforms")
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Unable to load platforms.");
        }
        return (await response.json()) as PlatformOption[];
      })
      .then((data) => {
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setPlatforms(sorted);
        }
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
    if (!results.length) {
      setMediaPreview(null);
      setMediaTrailers([]);
      setMediaVideos([]);
      setMediaLoading(false);
      setMediaError(null);
      return;
    }

    if (!mediaPreview) {
      return;
    }

    const match = results.find((game) => game.id === mediaPreview.gameId);
    if (!match) {
      setMediaPreview(null);
      setMediaTrailers([]);
      setMediaVideos([]);
      setMediaLoading(false);
      setMediaError(null);
      return;
    }

    if (match.name !== mediaPreview.title) {
      setMediaPreview({ gameId: match.id, title: match.name });
    }
  }, [mediaPreview, results]);

  const previewGameId = mediaPreview?.gameId ?? null;
  const previewTitle = mediaPreview?.title ?? null;

  useEffect(() => {
    if (!previewGameId || !previewTitle) {
      setMediaTrailers([]);
      setMediaVideos([]);
      setMediaLoading(false);
      setMediaError(null);
      return;
    }

    let cancelled = false;
    const trailerController = new AbortController();
    const youtubeController = new AbortController();

    setMediaLoading(true);
    setMediaError(null);
    setMediaTrailers([]);
    setMediaVideos([]);

    const fetchMedia = async () => {
      try {
        const [trailerResults, youtubeResults] = await Promise.all([
          fetch(`/api/rawg/movies/${previewGameId}`, { signal: trailerController.signal }).then(async (response) => {
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload) {
              const message = (payload as { error?: string } | null)?.error ?? "Tidak dapat memuat trailer RAWG.";
              throw new Error(message);
            }
            const rawResults = (payload as { results?: TrailerPreview[] }).results ?? [];
            return rawResults.filter((item): item is TrailerPreview => Boolean(item));
          }),
          fetch(`/api/youtube/gameplay?q=${encodeURIComponent(previewTitle)}`, {
            signal: youtubeController.signal,
          }).then(async (response) => {
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload) {
              const message = (payload as { error?: string } | null)?.error ?? "Tidak dapat memuat video gameplay.";
              throw new Error(message);
            }
            const rawResults = (payload as { results?: GameplayPreview[] }).results ?? [];
            return rawResults.filter((item): item is GameplayPreview => Boolean(item));
          }),
        ]);

        if (cancelled) {
          return;
        }

        setMediaTrailers(trailerResults);
        setMediaVideos(youtubeResults);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setMediaError(error instanceof Error ? error.message : "Tidak dapat memuat media permainan.");
        setMediaTrailers([]);
        setMediaVideos([]);
      } finally {
        if (!cancelled) {
          setMediaLoading(false);
        }
      }
    };

    fetchMedia();

    return () => {
      cancelled = true;
      trailerController.abort();
      youtubeController.abort();
    };
  }, [previewGameId, previewTitle]);

  useEffect(() => {
    if (!mediaPreview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMediaPreview(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaPreview]);

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

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
    if (selectedPlatform !== "all") {
      params.set("platform", selectedPlatform);
    }

    fetch(`/api/games/search?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Unable to search games.");
        }
        return response.json() as Promise<SearchResponse>;
      })
      .then((data) => {
        setResults(data.results);
        setPagination({
          total: data.pagination?.total ?? 0,
          page: data.pagination?.page ?? page,
          pageSize: data.pagination?.pageSize ?? pageSize,
          hasNextPage: Boolean(data.pagination?.hasNextPage),
          hasPreviousPage: Boolean(data.pagination?.hasPreviousPage),
        });
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
  }, [debouncedQuery, selectedPlatform, page, pageSize]);

  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setPage(1);
  }, [debouncedQuery, selectedPlatform]);

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
    if (page > 1) {
      params.set("page", String(page));
    }

    const nextSearch = params.toString();
    if (nextSearch === lastSyncedSearchRef.current) {
      return;
    }

    lastSyncedSearchRef.current = nextSearch;
    router.replace(`${pathname}${nextSearch ? `?${nextSearch}` : ""}`, { scroll: false });
  }, [debouncedQuery, selectedPlatform, page, pathname, router]);

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
    count: games.filter((game) => game.status === status).length,
  }));

  const filteredPlatforms = useMemo(() => {
    if (!platformSearch.trim()) {
      return platforms;
    }
    const term = platformSearch.trim().toLowerCase();
    return platforms.filter((platform) => platform.name.toLowerCase().includes(term));
  }, [platformSearch, platforms]);

  const selectedPlatformId = selectedPlatform !== "all" ? Number.parseInt(selectedPlatform, 10) : null;

  const displayedPlatforms = useMemo(() => {
    const top = filteredPlatforms.slice(0, 40);
    if (selectedPlatformId && !top.some((platform) => platform.id === selectedPlatformId)) {
      const selectedMatch = platforms.find((platform) => platform.id === selectedPlatformId);
      return selectedMatch ? [selectedMatch, ...top] : top;
    }
    return top;
  }, [filteredPlatforms, platforms, selectedPlatformId]);

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

  const totalGames = games.length || 1;
  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const playingGames = games.filter((game) => game.status === "playing");
  const wishlistGames = games.filter((game) => game.wishlist);
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(pagination.total, results.length) / Math.max(pagination.pageSize, 1)),
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
        (payload as { error?: string } | null)?.error ?? "Tidak dapat memuat detail game dari RAWG.";
      throw new Error(message);
    }
    return payload as DetailMetadata;
  };

  const handleAddToWishlist = async (game: SearchResult) => {
    const normalizedTitle = game.name.trim().toLowerCase();
    const existing = games.find((item) => item.title.trim().toLowerCase() === normalizedTitle);

    if (existing) {
      if (existing.wishlist) {
        setWishlistStatus({ message: `${game.name} sudah ada di wishlist kamu.`, tone: "info" });
        return;
      }

      setWishlistProcessingId(game.id);

      const needsMetadata =
        !existing.rawgId || !existing.coverImage || !existing.heroImage || !existing.screenshotUrls?.length;

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
        const detailScreenshots = detail?.gallery
          ?.map((shot) => shot?.url?.trim())
          .filter((url): url is string => Boolean(url)) ?? [];

        const updates: Partial<Game> = {};
        if (!existing.rawgId) {
          updates.rawgId = detail?.id ?? game.id;
        }
        if (detail?.thumbnail && !existing.coverImage) {
          updates.coverImage = detail.thumbnail;
        }
        if ((detail?.backgroundImage || detail?.thumbnail) && !existing.heroImage) {
          updates.heroImage = detail?.backgroundImage ?? detail?.thumbnail ?? undefined;
        }
        if (detailScreenshots.length && (!existing.screenshotUrls || existing.screenshotUrls.length === 0)) {
          updates.screenshotUrls = detailScreenshots;
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
      const primaryPlatform = game.platforms[0];
      const platformName = primaryPlatform?.name ?? "Unassigned platform";
      const platformIdentifier = primaryPlatform ? `rawg:${primaryPlatform.id}` : "rawg:unassigned";
      const detailScreenshots = detail?.gallery
        ?.map((shot) => shot?.url?.trim())
        .filter((url): url is string => Boolean(url)) ?? [];

      addGame({
        title: game.name,
        platformId: platformIdentifier,
        platformName,
        status: "backlog",
        format: "digital",
        source: "RAWG",
        fileName: game.name,
        folderPath: primaryPlatform?.slug,
        emulatorCore: undefined,
        shaderPreset: undefined,
        region: undefined,
        tags: game.platforms.map((platform) => platform.name).filter(Boolean),
        rating: game.rating ?? undefined,
        hoursPlayed: undefined,
        lastPlayedAt: undefined,
        notes: `Wishlist entry imported from RAWG on ${new Date().toLocaleDateString()}.`,
        favorite: false,
        wishlist: true,
        rawgId: detail?.id ?? game.id,
        coverImage: detail?.thumbnail ?? game.coverImage ?? undefined,
        heroImage: detail?.backgroundImage ?? detail?.thumbnail ?? game.coverImage ?? undefined,
        screenshotUrls: detailScreenshots.length ? detailScreenshots : undefined,
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
        description="Search the RAWG database, filter by console, and save wishlist ideas instantly."
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
                placeholder="Cari judul game dari RAWG..."
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
                ) : displayedPlatforms.length ? (
                  displayedPlatforms.map((platform) => (
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
              Mencari game di RAWG...
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          {!loading && !error && hasSearched && results.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada game yang cocok. Coba judul atau console lain.</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((game) => {
              const normalizedTitle = game.name.trim().toLowerCase();
              const existing = games.find((item) => item.title.trim().toLowerCase() === normalizedTitle);
              const isWishlisted = Boolean(existing?.wishlist);
              const isProcessing = wishlistProcessingId === game.id;
              const platformLabels = game.platforms.map((platform) => platform.name).filter(Boolean);
              const ratingLabel = game.rating?.toFixed(1) ?? "—";
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

              return (
                <article
                  key={game.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 text-slate-900 shadow-md shadow-slate-900/10 transition-colors duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-within:ring-offset-slate-900"
                >
                  <Link
                    href={detailHref}
                    className="relative block aspect-video w-full overflow-hidden bg-slate-200 focus:outline-none dark:bg-slate-800"
                  >
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
                      <span>{ratingLabel}</span>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{game.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {game.releaseYear ?? "Tahun rilis tidak diketahui"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Star className="h-3 w-3" />
                          <span>{ratingLabel}</span>
                        </div>
                      </div>
                      {platformLabels.length ? (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {platformLabels.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Platform tidak tersedia</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:focus-visible:ring-offset-slate-900"
                      >
                        Lihat detail
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setMediaPreview((current) =>
                            current?.gameId === game.id
                              ? null
                              : { gameId: game.id, title: game.name },
                          )
                        }
                        aria-pressed={mediaPreview?.gameId === game.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          mediaPreview?.gameId === game.id
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                            : "border-slate-300 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        <Clapperboard className="h-4 w-4" />
                        {mediaPreview?.gameId === game.id ? "Tutup media" : "Tampilkan media"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToWishlist(game)}
                        disabled={isWishlisted || isProcessing}
                        aria-pressed={isWishlisted}
                        aria-busy={isProcessing}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                          isWishlisted || isProcessing
                            ? "cursor-not-allowed border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                            : "border-emerald-500/40 bg-emerald-500/90 text-white hover:-translate-y-0.5 hover:border-emerald-400 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100"
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Star className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                        )}
                        {isProcessing
                          ? "Memproses..."
                          : isWishlisted
                            ? "Sudah di wishlist"
                            : "Tambah ke wishlist"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {mediaPreview ? (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
              onClick={() => setMediaPreview(null)}
            >
              <div
                className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setMediaPreview(null)}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-slate-900/10 text-slate-500 transition hover:bg-slate-900/20 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                  aria-label="Tutup media"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="max-h-[80vh] overflow-y-auto space-y-4 p-6 text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-3">
                    <Clapperboard className="h-5 w-5" aria-hidden="true" />
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                        Trailer & gameplay preview
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{mediaPreview.title}</p>
                    </div>
                  </div>
                  {mediaError ? (
                    <p className="text-sm text-rose-600 dark:text-rose-300">{mediaError}</p>
                  ) : null}
                  {mediaLoading ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Memuat trailer dan gameplay...
                    </p>
                  ) : null}
                  {!mediaLoading && !mediaError && mediaTrailers.length === 0 && mediaVideos.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Tidak ada trailer atau video gameplay yang ditemukan untuk judul ini.
                    </p>
                  ) : null}
                  {mediaTrailers.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {mediaTrailers.slice(0, 2).map((trailer) => {
                        const sources = trailer.data ?? {};
                        const src = sources.max ?? sources["1080"] ?? sources["720"] ?? sources["480"] ?? null;
                        if (!src) {
                          return null;
                        }
                        return (
                          <figure
                            key={trailer.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800"
                          >
                            <video controls poster={trailer.preview ?? undefined} className="h-48 w-full object-cover">
                              <source src={src} type="video/mp4" />
                            </video>
                            <figcaption className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {trailer.name}
                            </figcaption>
                          </figure>
                        );
                      })}
                    </div>
                  ) : null}
                  {mediaVideos.length ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {mediaVideos.slice(0, 3).map((video) => (
                        <article
                          key={video.videoId}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.videoId}`}
                              title={video.title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <div className="space-y-1 px-3 py-2">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{video.title}</h4>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{video.channelTitle}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {(pagination.total > pagination.pageSize || pagination.hasNextPage || pagination.hasPreviousPage) && (
            <nav
              aria-label="RAWG search pagination"
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500 dark:text-slate-400">Memuat dashboard…</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
