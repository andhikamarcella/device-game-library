import { NextRequest, NextResponse } from "next/server";

import { buildIgdbQuery, getIgdbToken, type SortKey } from "@/lib/igdb";
import { igdbCoverUrl, igdbScreenshotUrl } from "@/lib/igdbImages";

type IgdbPlatformRef = { id?: number; name?: string | null; slug?: string | null; abbreviation?: string | null };
type IgdbGenreRef = { id?: number; name?: string | null };
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
  cover?: { image_id?: string | null } | null;
  screenshots?: Array<{ image_id?: string | null }> | null;
  platforms?: IgdbPlatformRef[] | null;
  genres?: IgdbGenreRef[] | null;
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
  popularity: number | null;
};

export const dynamic = "force-dynamic";

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

  return { query, sort, platformId, page, pageSize };
};

async function executeSearch({
  query,
  sort,
  platformId,
  page,
  pageSize,
}: {
  query: string;
  sort: SortKey;
  platformId: number | null;
  page: number;
  pageSize: number;
}) {
  const { accessToken, clientId } = await getIgdbToken();

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const igdbQuery = buildIgdbQuery({
    searchText: query,
    sort,
    platformId,
    limit,
    offset,
  });

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
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }

  const games = (await igdbRes.json().catch(() => [])) as IgdbGameSearch[];

  const results: SearchResult[] = games.map((game) => {
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
      popularity: typeof game.total_rating_count === "number" ? game.total_rating_count : ratingsCount,
    };
  });

  const hasNextPage = results.length === limit;
  const hasPreviousPage = page > 1;
  const total = hasNextPage ? page * pageSize + 1 : (page - 1) * pageSize + results.length;

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

    const resolved = resolveSearchParams({ query, sort, platformId: platform, page: params.get("page"), pageSize: params.get("pageSize") });
    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => null)) || {}) as SearchParams;

    const resolved = resolveSearchParams(body);

    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }
}
