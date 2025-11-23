import { NextRequest, NextResponse } from "next/server";

import { IgdbRequestError, buildIgdbCountQuery, buildIgdbQuery, getIgdbToken, type SortKey } from "@/lib/igdb";
import {
  type IgdbAgeRating,
  type IgdbGameMode,
  type IgdbGenre,
  type IgdbPlayerPerspective,
  type IgdbTheme,
} from "@/types/igdb";
import { igdbCoverUrl, igdbScreenshotUrl } from "@/lib/igdbImages";

type IgdbPlatformRef = { id?: number; name?: string | null; slug?: string | null; abbreviation?: string | null };
type IgdbGenreRef = { id?: number; name?: string | null };
type IgdbThemeRef = { id?: number; name?: string | null };
type IgdbGameModeRef = { id?: number; name?: string | null };
type IgdbPerspectiveRef = { id?: number; name?: string | null };
type IgdbGameSearch = {
  id: number;
  slug?: string | null;
  name: string;
  summary?: string | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  total_rating?: number | null;
  total_rating_count?: number | null;
  first_release_date?: number | null;
  popularity?: number | null;
  cover?: { image_id?: string | null } | null;
  screenshots?: Array<{ image_id?: string | null }> | null;
  platforms?: IgdbPlatformRef[] | null;
  genres?: IgdbGenreRef[] | null;
  themes?: IgdbThemeRef[] | null;
  game_modes?: IgdbGameModeRef[] | null;
  player_perspectives?: IgdbPerspectiveRef[] | null;
  age_ratings?: Array<{ rating?: number | null }> | null;
};

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
  screenshots: string[];
  screenshotUrls?: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
  genres: string[];
  themes?: string[];
  gameModes?: string[];
  playerPerspectives?: string[];
  ageRatings?: number[];
  popularity: number | null;
};

export const dynamic = "force-dynamic";

const FILTER_OPTIONS_TTL = 1000 * 60 * 60; // 1 hour
const DEFAULT_RELEASE_YEAR_RANGE: [number, number] = [1980, 2025];

type FilterOptionsCache = {
  data: {
    genres: Array<{ id: number; name?: string | null; slug?: string | null }>;
    themes: Array<{ id: number; name?: string | null; slug?: string | null }>;
    gameModes: Array<{ id: number; name?: string | null; slug?: string | null }>;
    playerPerspectives: Array<{ id: number; name?: string | null; slug?: string | null }>;
    ageRatings: IgdbAgeRating[];
  };
  timestamp: number;
};

let filterOptionsCache: FilterOptionsCache | null = null;

const parseSortKey = (value: unknown): SortKey => {
  const normalized = typeof value === "string" ? value.trim() : "";

  const mapLegacy: Record<string, SortKey> = {
    popular: "most_popular",
    rating: "highest_rated",
    release_date: "newest",
    popular_desc: "most_popular",
    popular_asc: "least_popular",
    rating_desc: "highest_rated",
    rating_asc: "lowest_rated",
    release_desc: "newest",
    release_asc: "oldest",
    alphabetical_desc: "alphabetical_desc",
  };

  const allowed: SortKey[] = [
    "none",
    "most_popular",
    "least_popular",
    "highest_rated",
    "lowest_rated",
    "newest",
    "oldest",
    "alphabetical",
    "alphabetical_desc",
  ];

  if (normalized && mapLegacy[normalized]) {
    return mapLegacy[normalized];
  }

  if (normalized && allowed.includes(normalized as SortKey)) {
    return normalized as SortKey;
  }

  return "none";
};

type SearchParams = {
  query?: string;
  sort?: string;
  platform?: string | number | null;
  platformId?: string | number | null;
  page?: string | number | null;
  pageSize?: string | number | null;
  genres?: string | number[] | null;
  themes?: string | number[] | null;
  gameModes?: string | number[] | null;
  playerPerspectives?: string | number[] | null;
  ageRatings?: string | number[] | null;
  releaseFrom?: string | number | null;
  releaseTo?: string | number | null;
  filters?: string | null;
};

const resolveSearchParams = (params: SearchParams) => {
  const query = params.query?.toString().trim() ?? "";
  const sort = parseSortKey(params.sort);
  const platformRaw = params.platform ?? params.platformId;
  const platformId =
    typeof platformRaw === "string" && platformRaw !== "all" && Number.isFinite(Number(platformRaw))
      ? Number(platformRaw)
      : typeof platformRaw === "number"
        ? platformRaw
        : null;

  const parsedPage = Number.parseInt((params.page ?? "") as string, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedPageSize = Number.parseInt((params.pageSize ?? "") as string, 10);
  const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? Math.min(parsedPageSize, 50) : 20;

  const parseIds = (value?: string | number[] | null): number[] => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : value.toString().split(",");
    return raw
      .map((part) => part?.toString().trim())
      .filter((part): part is string => Boolean(part))
      .map((part) => Number.parseInt(part, 10))
      .filter((num) => Number.isFinite(num));
  };

  const parseYear = (value?: string | number | null): number | null => {
    if (!value && value !== 0) return null;
    const num = Number.parseInt(value as string, 10);
    return Number.isFinite(num) && num > 1970 && num < 2100 ? num : null;
  };

  const releaseYearFromRaw = parseYear(params.releaseFrom);
  const releaseYearToRaw = parseYear(params.releaseTo);

  const releaseYearFrom =
    typeof releaseYearFromRaw === "number" && typeof releaseYearToRaw === "number" && releaseYearFromRaw > releaseYearToRaw
      ? releaseYearToRaw
      : releaseYearFromRaw;
  const releaseYearTo =
    typeof releaseYearFromRaw === "number" && typeof releaseYearToRaw === "number" && releaseYearFromRaw > releaseYearToRaw
      ? releaseYearFromRaw
      : releaseYearToRaw;

  const isDefaultReleaseRange =
    releaseYearFrom === DEFAULT_RELEASE_YEAR_RANGE[0] && releaseYearTo === DEFAULT_RELEASE_YEAR_RANGE[1];

  const filters = {
    genres: parseIds(params.genres),
    themes: parseIds(params.themes),
    gameModes: parseIds(params.gameModes),
    playerPerspectives: parseIds(params.playerPerspectives),
    ageRatings: parseIds(params.ageRatings),
    releaseYearFrom: isDefaultReleaseRange ? null : releaseYearFrom,
    releaseYearTo: isDefaultReleaseRange ? null : releaseYearTo,
  };

  return { query, sort, platformId, page, pageSize, filters };
};

async function executeSearch({
  query,
  sort,
  platformId,
  page,
  pageSize,
  filters,
}: {
  query: string;
  sort: SortKey;
  platformId: number | null;
  page: number;
  pageSize: number;
  filters?: {
    genres: number[];
    themes: number[];
    gameModes: number[];
    playerPerspectives: number[];
    ageRatings: number[];
    releaseYearFrom: number | null;
    releaseYearTo: number | null;
  };
}) {
  const { accessToken, clientId } = await getIgdbToken();

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const releaseDateFrom =
    typeof filters?.releaseYearFrom === "number"
      ? Math.floor(Date.UTC(filters.releaseYearFrom, 0, 1) / 1000)
      : null;
  const releaseDateTo =
    typeof filters?.releaseYearTo === "number"
      ? Math.floor(Date.UTC(filters.releaseYearTo, 11, 31, 23, 59, 59) / 1000)
      : null;

  const normalizedFilters = {
    genres: filters?.genres ?? [],
    themes: filters?.themes ?? [],
    gameModes: filters?.gameModes ?? [],
    playerPerspectives: filters?.playerPerspectives ?? [],
    ageRatings: filters?.ageRatings ?? [],
    releaseDateFrom,
    releaseDateTo,
  } as const;

  const igdbQuery = buildIgdbQuery({
    searchText: query,
    sort,
    platformId,
    genres: normalizedFilters.genres,
    themes: normalizedFilters.themes,
    gameModes: normalizedFilters.gameModes,
    playerPerspectives: normalizedFilters.playerPerspectives,
    ageRatings: normalizedFilters.ageRatings,
    releaseDateFrom: normalizedFilters.releaseDateFrom,
    releaseDateTo: normalizedFilters.releaseDateTo,
    limit,
    offset,
  });

  const countQuery = buildIgdbCountQuery({
    searchText: query,
    platformId,
    genres: normalizedFilters.genres,
    themes: normalizedFilters.themes,
    gameModes: normalizedFilters.gameModes,
    playerPerspectives: normalizedFilters.playerPerspectives,
    ageRatings: normalizedFilters.ageRatings,
    releaseDateFrom: normalizedFilters.releaseDateFrom,
    releaseDateTo: normalizedFilters.releaseDateTo,
  });

  const countPromise = fetch("https://api.igdb.com/v4/games/count", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: countQuery,
  }).catch(() => null);

  const igdbRes = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: igdbQuery,
  });

  if (!igdbRes.ok) {
    const text = await igdbRes.text().catch(() => "");
    console.error("IGDB games search error", igdbRes.status, text);
    return NextResponse.json(
      {
        error: "IGDB search failed",
        results: [],
        pagination: { total: 0, page, pageSize: limit, hasNextPage: false, hasPreviousPage: false },
      },
      { status: 502 },
    );
  }

  const gamesPromise: Promise<IgdbGameSearch[]> = igdbRes
    .json()
    .catch(() => [] as IgdbGameSearch[]);

  const [countRes, gamesRaw] = await Promise.all([countPromise, gamesPromise] as const);

  const gamesRawTyped = gamesRaw as IgdbGameSearch[] | null;
  const games: IgdbGameSearch[] = Array.isArray(gamesRawTyped) ? gamesRawTyped : [];

  let totalFromCount: number | null = null;
  if (countRes && "ok" in countRes && countRes.ok) {
    const countPayload = (await countRes.json().catch(() => null)) as { count?: number } | null;
    if (typeof countPayload?.count === "number") {
      totalFromCount = countPayload.count;
    }
  }

  const results: SearchResult[] = games.map((game: IgdbGameSearch) => {
    const coverUrl = igdbCoverUrl(game.cover?.image_id ?? null);
    const screenshots = Array.isArray(game.screenshots)
      ? game.screenshots
          .map((shot) => igdbScreenshotUrl(shot?.image_id ?? null))
          .filter((url): url is string => Boolean(url))
      : [];

    const platforms: SearchPlatform[] = Array.isArray(game.platforms)
      ? game.platforms
          .map((platform) => ({
            id: platform?.id ?? 0,
            name: platform?.name ?? "Unknown",
            slug: platform?.slug ?? platform?.name ?? "",
            abbreviation: platform?.abbreviation ?? platform?.slug ?? platform?.name ?? null,
          }))
          .filter((platform) => Boolean(platform.name))
      : [];

    const genres = Array.isArray(game.genres)
      ? game.genres.map((genre) => genre?.name).filter((name): name is string => Boolean(name))
      : [];

    const releaseYear = game.first_release_date
      ? new Date(Number(game.first_release_date) * 1000).getFullYear()
      : null;

    const rating =
      typeof game.aggregated_rating === "number"
        ? game.aggregated_rating
        : typeof game.rating === "number"
          ? game.rating
          : null;

    const ratingsCount =
      typeof game.rating_count === "number"
        ? game.rating_count
        : typeof game.total_rating_count === "number"
          ? game.total_rating_count
          : 0;

    return {
      id: game.id,
      slug: game.slug ?? null,
      name: game.name,
      summary: game.summary ?? "",
      cover: game.cover ?? null,
      coverUrl,
      coverImageUrl: coverUrl,
      screenshots,
      screenshotUrls: screenshots,
      releaseYear,
      rating,
      ratingsCount,
      platforms,
      genres,
      themes: Array.isArray(game.themes)
        ? game.themes.map((theme) => theme?.name).filter((name): name is string => Boolean(name))
        : [],
      gameModes: Array.isArray(game.game_modes)
        ? game.game_modes.map((mode) => mode?.name).filter((name): name is string => Boolean(name))
        : [],
      playerPerspectives: Array.isArray(game.player_perspectives)
        ? game.player_perspectives.map((perspective) => perspective?.name).filter((name): name is string => Boolean(name))
        : [],
      ageRatings: Array.isArray(game.age_ratings)
        ? game.age_ratings
            .map((rating) => rating?.rating)
            .filter((value): value is number => typeof value === "number")
        : [],
      popularity:
        typeof game.popularity === "number"
          ? game.popularity
          : typeof game.total_rating_count === "number"
            ? game.total_rating_count
            : ratingsCount,
    };
  });

  const derivedTotal =
    typeof totalFromCount === "number"
      ? totalFromCount
      : results.length === limit
        ? page * pageSize + 1
        : (page - 1) * pageSize + results.length;

  const hasNextPage =
    typeof totalFromCount === "number" ? page * pageSize < totalFromCount : results.length === limit;
  const hasPreviousPage = page > 1;
  const total = derivedTotal;

  return NextResponse.json({
    games: results,
    results,
    pagination: {
      total,
      page,
      pageSize: limit,
      hasNextPage,
      hasPreviousPage,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const query = params.get("q") ?? params.get("query") ?? "";
    const sort = params.get("sort") ?? undefined;
    const platform = params.get("platformId") ?? params.get("platform") ?? undefined;

    if (params.get("filters") === "options") {
      const options = await loadFilterOptions();
      return NextResponse.json(options);
    }

    const resolved = resolveSearchParams({
      query,
      sort,
      platformId: platform,
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      genres: params.get("genres"),
      themes: params.get("themes"),
      gameModes: params.get("gameModes"),
      playerPerspectives: params.get("playerPerspectives"),
      ageRatings: params.get("ageRatings"),
      releaseFrom: params.get("releaseFrom"),
      releaseTo: params.get("releaseTo"),
    });
    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json(
      { error: "IGDB search failed", results: [], pagination: { total: 0, page: 1, pageSize: 20, hasNextPage: false, hasPreviousPage: false } },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => null)) || {}) as SearchParams;

    const resolved = resolveSearchParams(body);

    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json(
      { error: "IGDB search failed", results: [], pagination: { total: 0, page: 1, pageSize: 20, hasNextPage: false, hasPreviousPage: false } },
      { status: 502 },
    );
  }
}

const fetchList = async <T extends { id?: number; name?: string | null; slug?: string | null }>(
  endpoint: string,
  fields: string,
): Promise<Array<{ id: number; name?: string | null; slug?: string | null }>> => {
  const { accessToken, clientId } = await getIgdbToken();
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: [fields, "sort name asc;", "limit 200;"].join("\n"),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.error(`IGDB filter fetch failed for ${endpoint}`, res.status, text);
    if (res.status === 429) {
      throw new IgdbRequestError(`IGDB ${endpoint} rate limited`, res.status, text);
    }
    return [];
  }

  const data = (text ? (JSON.parse(text) as T[]) : []) || [];
  return data
    .map((item) => ({ id: item.id ?? 0, name: item.name ?? null, slug: item.slug ?? null }))
    .filter((item) => Number.isFinite(item.id) && item.name);
};

async function loadFilterOptions() {
  if (filterOptionsCache && Date.now() - filterOptionsCache.timestamp < FILTER_OPTIONS_TTL) {
    return filterOptionsCache.data;
  }

  try {
    const [genres, themes, gameModes, playerPerspectives, ageRatings] = await Promise.all([
      fetchList<IgdbGenre>("genres", "fields id,name,slug;"),
      fetchList<IgdbTheme>("themes", "fields id,name,slug;"),
      fetchList<IgdbGameMode>("game_modes", "fields id,name,slug;"),
      fetchList<IgdbPlayerPerspective>("player_perspectives", "fields id,name,slug;"),
      (async () => {
        const { accessToken, clientId } = await getIgdbToken();
        const res = await fetch("https://api.igdb.com/v4/age_ratings", {
          method: "POST",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: ["fields id,rating,category;", "limit 100;"].join("\n"),
        });

        const text = await res.text().catch(() => "");

        if (!res.ok) {
          console.error("IGDB age ratings fetch failed", res.status, text);
          if (res.status === 429) {
            throw new IgdbRequestError("IGDB age ratings rate limited", res.status, text);
          }
          return [] as IgdbAgeRating[];
        }
        return (text ? (JSON.parse(text) as IgdbAgeRating[]) : []) || [];
      })(),
    ]);

    const data = {
      genres,
      themes,
      gameModes,
      playerPerspectives,
      ageRatings: Array.isArray(ageRatings) ? ageRatings : [],
    } as const;

    filterOptionsCache = { data, timestamp: Date.now() };

    return data;
  } catch (error) {
    if (error instanceof IgdbRequestError && error.status === 429 && filterOptionsCache) {
      console.warn("IGDB filter options rate limited, serving cached filters");
      return filterOptionsCache.data;
    }

    console.error("IGDB filter options failed", error);
    return filterOptionsCache?.data ?? {
      genres: [],
      themes: [],
      gameModes: [],
      playerPerspectives: [],
      ageRatings: [],
    };
  }
}
