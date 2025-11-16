import { NextResponse } from "next/server";
import { buildIgdbImageUrl, type IgdbSearchParams, searchIgdbGames } from "@/lib/igdb";

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
    const searchParamsPayload: IgdbSearchParams = {
      search: query || undefined,
      ordering: ordering ?? (query ? "-rating" : "-added"),
      platforms: normalizedPlatformId ? String(normalizedPlatformId) : undefined,
      page,
      page_size: pageSize,
    };

    const games = await searchIgdbGames(searchParamsPayload);
    const results = games.results.map((game) => {
      const releaseYearValue = game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null;
      const releaseYear =
        typeof releaseYearValue === "number" && Number.isFinite(releaseYearValue)
          ? releaseYearValue
          : null;
      return {
        id: game.id,
        name: game.name,
        coverImage: game.cover?.image_id ? buildIgdbImageUrl(game.cover.image_id, "cover_big") : null,
        releaseYear,
        rating: typeof game.total_rating === "number" ? game.total_rating : null,
        ratingsCount: game.total_rating_count ?? 0,
        platforms: (game.platforms ?? [])
          .map((platform) => ({
            id: platform.id,
            name: platform.name ?? "Unknown",
            slug:
              platform.abbreviation?.toLowerCase() ??
              platform.name?.toLowerCase().replace(/\s+/g, "-") ??
              String(platform.id),
          }))
          .filter((platform) => Boolean(platform.name)),
      };
    });

    return NextResponse.json({
      results,
      pagination: {
        total: games.total,
        page,
        pageSize,
        hasNextPage: page * games.pageSize < games.total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("IGDB search error", error);
    const message = error instanceof Error ? error.message : "Unable to search games.";
    const status = message.toLowerCase().includes("provide a search term") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
