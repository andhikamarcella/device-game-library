import { NextResponse } from "next/server";

import { searchGamesRawg } from "@/lib/rawg";
import { resolveTgdbBoxArt, searchGamesTgdb } from "@/lib/tgdb";

const PLATFORM_SLUG_TO_PARENT: Record<string, number> = {
  pc: 1,
  playstation: 2,
  xbox: 3,
  ios: 4,
  mac: 5,
  linux: 6,
  nintendo: 7,
  android: 8,
  atari: 9,
  "commodore-amiga": 10,
  sega: 11,
  "3do": 12,
  "neo-geo": 13,
  web: 14,
};

const PAGE_SIZE_DEFAULT = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const platformParam = searchParams.get("platform")?.trim();
  const pageSizeParam = Number.parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT), 10);
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(pageSizeParam, 40) : PAGE_SIZE_DEFAULT;

  if (!query && !platformParam) {
    return NextResponse.json({ error: "Provide a search term or choose a console to browse games." }, { status: 400 });
  }

  const parentPlatform = platformParam
    ? PLATFORM_SLUG_TO_PARENT[platformParam] ?? (Number.isFinite(Number(platformParam)) ? Number(platformParam) : undefined)
    : undefined;

  try {
    const rawgResponse = await searchGamesRawg(query, page, pageSize, parentPlatform);

    const mapped = rawgResponse.results.map((game) => {
      const releaseYear = game.released ? Number.parseInt(game.released.slice(0, 4), 10) : null;
      return {
        id: game.id,
        slug: game.slug,
        name: game.name,
        coverImage: game.background_image,
        releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
        rating: game.rating ?? null,
        ratingsCount: game.ratings_count ?? 0,
        playtime: game.playtime ?? null,
        metacritic: game.metacritic ?? null,
        platforms:
          game.parent_platforms?.map(({ platform }) => ({
            id: platform.id,
            name: platform.name,
            slug: platform.slug,
          })) ?? [],
        genres: game.genres?.map((genre) => genre.name).filter(Boolean) ?? [],
        source: "rawg" as const,
      };
    });

    if (mapped.length > 0 || !query) {
      return NextResponse.json({
        results: mapped,
        pagination: {
          total: rawgResponse.count,
          page,
          pageSize,
          hasNextPage: Boolean(rawgResponse.next),
          hasPreviousPage: Boolean(rawgResponse.previous) || page > 1,
        },
      });
    }

    // RAWG returned no results. Attempt a TGDB fallback for retro searches.
    try {
      const tgdbResponse = await searchGamesTgdb(query);
      const baseUrl = tgdbResponse.data.base_url;
      const tgdbGames = tgdbResponse.data.games ?? [];
      const retroResults = tgdbGames.slice(0, pageSize).map((game) => ({
        id: game.id,
        slug: String(game.id),
        name: game.game_title,
        coverImage: resolveTgdbBoxArt(game, baseUrl) ?? null,
        releaseYear: game.release_date ? Number.parseInt(game.release_date.slice(0, 4), 10) : null,
        rating: null,
        ratingsCount: 0,
        playtime: null,
        metacritic: null,
        platforms: [],
        genres: [],
        source: "tgdb" as const,
      }));

      return NextResponse.json({
        results: retroResults,
        pagination: {
          total: retroResults.length,
          page: 1,
          pageSize: retroResults.length,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    } catch (fallbackError) {
      console.warn("TGDB fallback error", fallbackError);
      return NextResponse.json({
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }
  } catch (error) {
    console.error("Search fusion error", error);
    const message = error instanceof Error ? error.message : "Unable to search games.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

