import { NextRequest, NextResponse } from "next/server";

import { buildIgdbImageUrl, searchIgdbGames, type IgdbGame, type IgdbPlatformRef } from "@/lib/igdb";

export const dynamic = "force-dynamic";

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

const clampPageSize = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 20;
  }
  return Math.min(Math.max(Math.floor(value), 1), 50);
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

const mapGameToResult = (game: IgdbGame): SearchResult => {
  const coverImage = game.cover?.image_id ? buildIgdbImageUrl(game.cover.image_id, "cover_big") : null;
  const releaseYear =
    typeof game.first_release_date === "number" && game.first_release_date > 0
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null;
  const rating =
    typeof game.total_rating === "number"
      ? game.total_rating
      : typeof game.rating === "number"
        ? game.rating
        : null;
  const ratingsCount =
    typeof game.total_rating_count === "number"
      ? game.total_rating_count
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
        }))
    : [];

  return {
    id: game.id,
    name: game.name,
    coverImage,
    releaseYear,
    rating,
    ratingsCount,
    platforms,
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
      "";
    const limitParam = url.searchParams.get("pageSize") ?? url.searchParams.get("limit") ?? "20";
    const pageParam = url.searchParams.get("page") ?? "1";

    const pageSize = clampPageSize(Number.parseInt(limitParam, 10));
    const pageCandidate = Number.parseInt(pageParam, 10);
    const page = Number.isFinite(pageCandidate) && pageCandidate > 0 ? pageCandidate : 1;

    const igdbResponse = await searchIgdbGames({
      search: q || undefined,
      platforms: platformParam && platformParam !== "all" ? platformParam : undefined,
      page,
      page_size: pageSize,
    });

    const normalizedResults = igdbResponse.results.map(mapGameToResult);
    const total = typeof igdbResponse.total === "number" ? igdbResponse.total : normalizedResults.length;
    const normalizedPageSize =
      typeof igdbResponse.pageSize === "number" && igdbResponse.pageSize > 0 ? igdbResponse.pageSize : pageSize;
    const normalizedPage = typeof igdbResponse.page === "number" && igdbResponse.page > 0 ? igdbResponse.page : page;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(normalizedPageSize, 1)));

    const payload: SearchResponsePayload = {
      results: normalizedResults,
      pagination: {
        total,
        page: normalizedPage,
        pageSize: normalizedPageSize,
        hasNextPage: normalizedPage < totalPages,
        hasPreviousPage: normalizedPage > 1,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed" }, { status: 500 });
  }
}
