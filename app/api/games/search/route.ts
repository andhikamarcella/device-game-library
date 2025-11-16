import { NextResponse } from "next/server";
import { RawgSearchParams, searchGames } from "@/lib/rawg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number.parseInt(pageParam, 10) || 1 : 1;
  const platformParam = searchParams.get("platform");
  const platformId = platformParam ? Number.parseInt(platformParam, 10) : undefined;
  const pageSizeParam = searchParams.get("pageSize");
  const ordering = searchParams.get("ordering") ?? undefined;
  const pageSizeCandidate = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : undefined;
  const pageSize = pageSizeCandidate && pageSizeCandidate > 0 ? Math.min(pageSizeCandidate, 40) : 5;
  const normalizedPlatformId =
    typeof platformId === "number" && Number.isFinite(platformId) ? platformId : undefined;

  if (!query && !platformId) {
    return NextResponse.json(
      { error: "Provide a search term or choose a console to browse games." },
      { status: 400 },
    );
  }

  try {
    const searchParamsPayload: RawgSearchParams = {
      search: query || undefined,
      ordering: ordering ?? (query ? "-rating" : "-added"),
      platforms: normalizedPlatformId ? String(normalizedPlatformId) : undefined,
      page,
      page_size: pageSize,
    };

    const games = await searchGames(searchParamsPayload);
    const results = games.results.map((game) => {
      const releaseYear = game.released ? Number.parseInt(game.released.slice(0, 4), 10) : null;
      return {
        id: game.id,
        name: game.name,
        coverImage: game.background_image,
        releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
        rating: game.rating ?? null,
        ratingsCount: game.ratings_count ?? 0,
        platforms: (game.platforms ?? [])
          .map((entry) => ({
            id: entry.platform.id,
            name: entry.platform.name,
            slug: entry.platform.slug,
          }))
          .filter((platform) => Boolean(platform.name)),
      };
    });

    return NextResponse.json({
      results,
      pagination: {
        total: games.count,
        page,
        pageSize,
        hasNextPage: Boolean(games.next),
        hasPreviousPage: Boolean(games.previous) || page > 1,
      },
    });
  } catch (error) {
    console.error("RAWG search error", error);
    const message = error instanceof Error ? error.message : "Unable to search games.";
    const status = message.toLowerCase().includes("provide a search term") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
