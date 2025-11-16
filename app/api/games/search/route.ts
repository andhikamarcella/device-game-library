import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IGDB_BASE_URL = process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4";
const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

const SORT_MAP: Record<string, string> = {
  popular: "popularity desc",
  rating: "total_rating desc",
  release_date: "first_release_date desc",
  popular_desc: "popularity desc",
  popular_asc: "popularity asc",
  rating_desc: "total_rating desc",
  rating_asc: "total_rating asc",
  release_desc: "first_release_date desc",
  release_asc: "first_release_date asc",
};

const DEFAULT_SORT = "popular";

const sanitizePlatformId = (value: string | null): number | null => {
  if (!value || value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildImageUrl = (
  imageId: string | null | undefined,
  type: "cover" | "screenshot",
): string | null => {
  if (!imageId) {
    return null;
  }
  const size = type === "cover" ? "t_cover_big" : "t_screenshot_big";
  return `${IGDB_IMAGE_BASE}/${size}/${imageId}.jpg`;
};

const normalizePlatforms = (
  platforms: Array<{ id?: number; name?: string | null; abbreviation?: string | null; slug?: string | null }>,
): Array<{ id: number; name: string; slug: string; abbreviation?: string | null }> => {
  return platforms
    .filter((platform): platform is { id: number; name?: string | null; abbreviation?: string | null; slug?: string | null } =>
      typeof platform?.id === "number",
    )
    .map((platform) => ({
      id: platform.id,
      name: platform.name?.trim() || `Platform ${platform.id}`,
      slug:
        platform.slug?.trim() ||
        platform.name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
        `igdb-${platform.id}`,
      abbreviation: platform.abbreviation ?? null,
    }));
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const platformIdParam = searchParams.get("platformId")?.trim() ?? searchParams.get("platform")?.trim() ?? null;
  const sortParam = (searchParams.get("sort")?.trim().toLowerCase() ?? DEFAULT_SORT) as keyof typeof SORT_MAP;

  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;

  if (!clientId || !accessToken) {
    console.error("[IGDB] Missing credentials", {
      hasClientId: Boolean(clientId),
      hasAccessToken: Boolean(accessToken),
    });
    return NextResponse.json(
      { error: "Server misconfigured: missing IGDB credentials" },
      { status: 500 },
    );
  }

  const conditions: string[] = ["category = (0, 8)"];
  const platformId = sanitizePlatformId(platformIdParam);
  if (platformId !== null) {
    conditions.push(`platforms = (${platformId})`);
  }
  if (q) {
    const escaped = q.replace(/"/g, '\\"');
    conditions.push(`(name ~ *"${escaped}"* | alternative_names.name ~ *"${escaped}"*)`);
  }
  const whereClause = conditions.length ? `where ${conditions.join(" & ")};` : "";

  const sortKey = SORT_MAP[sortParam] ? sortParam : (DEFAULT_SORT as keyof typeof SORT_MAP);
  const sortClause = `sort ${SORT_MAP[sortKey]};`;

  const query = [
    `fields id, name, slug, first_release_date, summary, total_rating, total_rating_count, rating, rating_count, platforms.id, platforms.name, platforms.abbreviation, platforms.slug, cover.image_id, screenshots.image_id;`,
    whereClause,
    sortClause,
    "limit 50;",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${IGDB_BASE_URL}/games`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: query,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("[IGDB] search failed", response.status, text);
    return NextResponse.json(
      { error: "IGDB search failed", status: response.status },
      { status: 500 },
    );
  }

  const data = JSON.parse(text) as Array<{
    id: number;
    name: string;
    slug?: string | null;
    summary?: string | null;
    total_rating?: number | null;
    total_rating_count?: number | null;
    rating?: number | null;
    rating_count?: number | null;
    first_release_date?: number | null;
    platforms?: Array<{ id?: number; name?: string | null; abbreviation?: string | null; slug?: string | null }>;
    cover?: { image_id?: string | null } | null;
    screenshots?: Array<{ image_id?: string | null } | null>;
  }>;

  const results = data.map((game) => {
    const coverUrl = buildImageUrl(game.cover?.image_id ?? null, "cover");
    const screenshots = (game.screenshots ?? [])
      .map((shot) => buildImageUrl(shot?.image_id ?? null, "screenshot"))
      .filter((url): url is string => Boolean(url));

    const ratingsCount = typeof game.total_rating_count === "number"
      ? game.total_rating_count
      : typeof game.rating_count === "number"
        ? game.rating_count
        : 0;

    return {
      id: game.id,
      name: game.name,
      slug: game.slug ?? undefined,
      summary: game.summary ?? undefined,
      totalRating: typeof game.total_rating === "number" ? game.total_rating : null,
      rating: typeof game.rating === "number" ? game.rating : null,
      firstReleaseDate: typeof game.first_release_date === "number" ? game.first_release_date : null,
      platforms: normalizePlatforms(game.platforms ?? []),
      coverUrl,
      coverImageUrl: coverUrl,
      screenshots,
      screenshotUrls: screenshots,
      ratingsCount,
    };
  });

  return NextResponse.json({
    results,
    pagination: {
      total: results.length,
      page: 1,
      pageSize: results.length,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
}
