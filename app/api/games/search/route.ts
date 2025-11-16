import { NextRequest, NextResponse } from "next/server";

import { getIgdbImageUrl, igdbRequest, type IgdbPlatformRef } from "@/lib/igdb";

export const dynamic = "force-dynamic";

type IgdbScreenshot = { id?: number; image_id?: string | null };

type IgdbGameRecord = {
  id: number;
  name: string;
  slug?: string | null;
  summary?: string | null;
  first_release_date?: number | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  aggregated_rating_count?: number | null;
  rating_count?: number | null;
  popularity?: number | null;
  platforms?: IgdbPlatformRef[];
  cover?: { image_id?: string | null };
  screenshots?: IgdbScreenshot[];
  genres?: Array<{ id?: number; name?: string | null }>;
};

type SearchPlatform = {
  id: number;
  name: string;
  slug: string;
  abbreviation: string | null;
};

type SearchResult = {
  id: number;
  slug: string | null;
  name: string;
  summary: string;
  coverImageUrl: string | null;
  screenshotUrls: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
  genres: string[];
  popularity: number | null;
};

type SearchResponsePayload = {
  results: SearchResult[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type SortParam =
  | "popular_desc"
  | "popular_asc"
  | "rating_desc"
  | "rating_asc"
  | "release_desc"
  | "release_asc";

const SORT_CLAUSES: Record<SortParam, string> = {
  popular_desc: "popularity desc",
  popular_asc: "popularity asc",
  rating_desc: "aggregated_rating desc",
  rating_asc: "aggregated_rating asc",
  release_desc: "first_release_date desc",
  release_asc: "first_release_date asc",
};

const DEFAULT_SORT: SortParam = "popular_desc";

const clampPageSize = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 20;
  }
  return Math.min(Math.max(Math.floor(value), 1), 50);
};

const parsePlatformIds = (value: string | null): number[] => {
  if (!value || value === "all") {
    return [];
  }
  return value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part));
};

const normalizePlatformSlug = (platform: IgdbPlatformRef): string => {
  if (platform.slug && platform.slug.trim().length > 0) {
    return platform.slug.trim();
  }
  if (platform.abbreviation && platform.abbreviation.trim().length > 0) {
    return platform.abbreviation.trim().toLowerCase().replace(/\s+/g, "-");
  }
  if (platform.name && platform.name.trim().length > 0) {
    return platform.name.trim().toLowerCase().replace(/\s+/g, "-");
  }
  return `igdb-platform-${platform.id}`;
};

const normalizePlatformName = (platform: IgdbPlatformRef): string => {
  if (platform.name && platform.name.trim().length > 0) {
    return platform.name.trim();
  }
  if (platform.slug && platform.slug.trim().length > 0) {
    return platform.slug
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
  }
  if (platform.abbreviation && platform.abbreviation.trim().length > 0) {
    return platform.abbreviation.trim();
  }
  return `Platform ${platform.id}`;
};

const mapGameToResult = (game: IgdbGameRecord): SearchResult => {
  const coverImageUrl = getIgdbImageUrl(game.cover?.image_id, "cover");
  const releaseYear =
    typeof game.first_release_date === "number" && game.first_release_date > 0
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null;
  const rating =
    typeof game.aggregated_rating === "number"
      ? game.aggregated_rating
      : typeof game.rating === "number"
        ? game.rating
        : null;
  const ratingsCount =
    typeof game.aggregated_rating_count === "number"
      ? game.aggregated_rating_count
      : typeof game.rating_count === "number"
        ? game.rating_count
        : 0;
  const platforms: SearchPlatform[] = Array.isArray(game.platforms)
    ? game.platforms
        .filter((platform): platform is IgdbPlatformRef => Boolean(platform && typeof platform.id === "number"))
        .map((platform) => ({
          id: platform.id,
          name: normalizePlatformName(platform),
          slug: normalizePlatformSlug(platform),
          abbreviation: platform.abbreviation ?? null,
        }))
    : [];
  const screenshotUrls = (game.screenshots ?? [])
    .map((shot) => getIgdbImageUrl(shot.image_id, "screenshot"))
    .filter((url): url is string => Boolean(url));
  const genres = (game.genres ?? [])
    .map((genre) => genre?.name?.trim())
    .filter((name): name is string => Boolean(name));

  return {
    id: game.id,
    slug: typeof game.slug === "string" ? game.slug : null,
    name: game.name,
    summary: game.summary ?? "",
    coverImageUrl,
    screenshotUrls,
    releaseYear,
    rating,
    ratingsCount,
    platforms,
    genres,
    popularity: typeof game.popularity === "number" ? game.popularity : null,
  };
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const platformParam =
      url.searchParams.get("platform") ??
      url.searchParams.get("platformId") ??
      url.searchParams.get("platforms") ??
      null;
    const limitParam = url.searchParams.get("pageSize") ?? url.searchParams.get("limit") ?? "20";
    const pageParam = url.searchParams.get("page") ?? "1";
    const requestedSort = url.searchParams.get("sort");
    const sortParam: SortParam =
      requestedSort && Object.hasOwn(SORT_CLAUSES, requestedSort)
        ? (requestedSort as SortParam)
        : DEFAULT_SORT;
    const resolvedSort = sortParam;

    const pageSize = clampPageSize(Number.parseInt(limitParam, 10));
    const pageCandidate = Number.parseInt(pageParam, 10);
    const page = Number.isFinite(pageCandidate) && pageCandidate > 0 ? pageCandidate : 1;
    const offset = (page - 1) * pageSize;

    const escapedSearch = q ? q.replace(/"/g, '\\"') : "";
    const platformIds = parsePlatformIds(platformParam);

    const queryParts: string[] = [
      "fields",
      "  id,",
      "  slug,",
      "  name,",
      "  summary,",
      "  first_release_date,",
      "  aggregated_rating,",
      "  rating,",
      "  aggregated_rating_count,",
      "  rating_count,",
      "  popularity,",
      "  platforms.id,",
      "  platforms.name,",
      "  platforms.abbreviation,",
      "  platforms.slug,",
      "  cover.image_id,",
      "  screenshots.id,",
      "  screenshots.image_id,",
      "  genres.id,",
      "  genres.name;",
    ];

    if (escapedSearch) {
      queryParts.push(`search "${escapedSearch}";`);
    }

    const whereClauses: string[] = ["name != null"];
    if (platformIds.length) {
      whereClauses.push(`platforms = (${platformIds.join(",")})`);
    }

    if (whereClauses.length) {
      queryParts.push(`where ${whereClauses.join(" & ")};`);
    }

    queryParts.push(`sort ${SORT_CLAUSES[resolvedSort]};`);
    queryParts.push(`limit ${pageSize};`);
    queryParts.push(`offset ${offset};`);

    const games = await igdbRequest<IgdbGameRecord[]>("games", queryParts.join("\n"));
    const results = games.map(mapGameToResult);

    let total = offset + results.length;
    if (!escapedSearch) {
      try {
        const countQuery = whereClauses.length ? `where ${whereClauses.join(" & ")};` : "";
        const counts = await igdbRequest<Array<{ count: number }>>("games/count", countQuery);
        if (Array.isArray(counts) && typeof counts[0]?.count === "number") {
          total = counts[0].count;
        }
      } catch (countError) {
        console.error("IGDB search count error", countError);
      }
    }

    const totalPages = Math.max(1, Math.ceil(Math.max(total, results.length) / pageSize));
    const pagination = {
      total,
      page,
      pageSize,
      hasNextPage: page < totalPages && results.length === pageSize,
      hasPreviousPage: page > 1,
    };

    const payload: SearchResponsePayload = { results, pagination };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed" }, { status: 500 });
  }
}
