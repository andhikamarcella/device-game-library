import { NextResponse } from "next/server";
import { pickBestImage } from "@/lib/images";
import { searchGames } from "@/lib/gameData";

const PAGE_SIZE = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;

  if (!query) {
    return NextResponse.json({ error: "Query parameter q is required." }, { status: 400 });
  }

  try {
    const data = await searchGames({
      search: query,
      page: normalizedPage,
      page_size: PAGE_SIZE,
    });

    const results = data.results.map((game) => {
      const coverImage =
        pickBestImage([
          game.background_image,
          game.background_image_additional,
          ...(game.short_screenshots?.map((shot) => shot.image) ?? []),
        ]) ?? null;

      return {
        id: game.id,
        slug: game.slug ?? game.id.toString(),
        name: game.name,
        background_image: coverImage,
        rating: game.rating,
        genres: game.genres ?? [],
        platforms: game.platforms ?? [],
        parent_platforms: game.parent_platforms ?? [],
        playtime: game.playtime ?? 0,
        released: game.released,
      };
    });

    return NextResponse.json({
      results,
      pagination: {
        total: data.count,
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        hasNextPage: data.next !== null,
        hasPreviousPage: data.previous !== null || normalizedPage > 1,
      },
    });
  } catch (error) {
    console.error("IGDB search error", error);
    const message = error instanceof Error ? error.message : "Unable to search IGDB.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
