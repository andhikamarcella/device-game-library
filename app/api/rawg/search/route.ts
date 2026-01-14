import { NextResponse } from "next/server";
import { fetchFromRawg } from "@/lib/server/rawgClient";

type RawgGenre = {
  id: number;
  name: string;
  slug: string;
};

type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

type RawgSearchGame = {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  rating: number | null;
  released: string | null;
  playtime: number | null;
  genres: RawgGenre[];
  platforms: RawgPlatform[];
};

type RawgSearchResponse = {
  results: RawgSearchGame[];
  count: number;
  next: string | null;
  previous: string | null;
};

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
    const data = await fetchFromRawg<RawgSearchResponse>("/games", {
      search: query,
      page: normalizedPage,
      page_size: PAGE_SIZE,
    });

    const results = data.results.map((game) => ({
      id: game.id,
      slug: game.slug,
      name: game.name,
      background_image: game.background_image,
      rating: game.rating,
      genres: game.genres?.map((genre) => ({ id: genre.id, name: genre.name, slug: genre.slug })) ?? [],
      platforms:
        game.platforms?.map((entry) => ({
          id: entry.platform.id,
          name: entry.platform.name,
          slug: entry.platform.slug,
        })) ?? [],
      playtime: game.playtime ?? 0,
      released: game.released,
    }));

    return NextResponse.json({
      results,
      pagination: {
        total: data.count,
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        hasNextPage: Boolean(data.next),
        hasPreviousPage: Boolean(data.previous) || normalizedPage > 1,
      },
    });
  } catch (error) {
    console.error("RAWG search error", error);
    const message = error instanceof Error ? error.message : "Unable to search RAWG.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
