import { NextRequest, NextResponse } from "next/server";

import { igdbFetch } from "@/lib/igdb";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

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

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q") ?? "";
    const q = rawQ.trim();
    const platformId = searchParams.get("platformId");
    const sort = searchParams.get("sort") || "total_rating_count desc";

    if (!q && !platformId) {
      return NextResponse.json(
        { error: "Query parameter `q` or `platformId` is required" },
        { status: 400 },
      );
    }

    const whereClauses = ["category = 0"];
    if (platformId && platformId !== "all") {
      whereClauses.push(`platforms = ${platformId}`);
    }

    const searchBlock = q ? `search "${q.replace(/"/g, '\\"')}";` : "";
    const whereBlock = `where ${whereClauses.join(" & ")};`;

    const body = `
      fields
        id,
        name,
        first_release_date,
        summary,
        rating,
        rating_count,
        total_rating,
        total_rating_count,
        platforms.id,
        platforms.name,
        cover.image_id,
        screenshots.image_id;
      ${searchBlock}
      ${whereBlock}
      sort ${sort};
      limit 50;
    `;

    const games = await igdbFetch<any[]>("games", body);

    const results = games.map((game) => {
      const coverUrl = buildImageUrl(game.cover?.image_id ?? null, "cover");
      const screenshots = (game.screenshots ?? [])
        .map((shot: { image_id?: string | null }) => buildImageUrl(shot?.image_id ?? null, "screenshot"))
        .filter((url: string | null | undefined): url is string => Boolean(url));

      const releaseYear = game.first_release_date
        ? new Date(Number(game.first_release_date) * 1000).getFullYear() || null
        : null;

      const ratingsCount = typeof game.total_rating_count === "number"
        ? game.total_rating_count
        : typeof game.rating_count === "number"
          ? game.rating_count
          : 0;

      return {
        id: game.id,
        name: game.name,
        slug: null,
        summary: game.summary ?? "",
        coverUrl,
        coverImageUrl: coverUrl,
        screenshots,
        screenshotUrls: screenshots,
        releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
        rating:
          typeof game.total_rating === "number"
            ? game.total_rating
            : typeof game.rating === "number"
              ? game.rating
              : null,
        ratingsCount,
        platforms: normalizePlatforms(game.platforms ?? []),
        genres: [],
      };
    });

    return NextResponse.json({
      games,
      results,
      pagination: {
        total: results.length,
        page: 1,
        pageSize: results.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json(
      { error: "IGDB search failed" },
      { status: 500 },
    );
  }
}
