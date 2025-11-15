import { NextResponse } from "next/server";
import { fetchFromRawg } from "@/lib/server/rawgClient";

type RawgGenre = {
  id: number;
  name: string;
  slug: string;
};

type RawgParentPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  rating: number | null;
  released: string | null;
  playtime: number | null;
  genres?: RawgGenre[];
  parent_platforms?: RawgParentPlatform[];
};

type RawgDetailsResponse = RawgGame & {
  genres: RawgGenre[];
  parent_platforms: RawgParentPlatform[];
};

type RawgSearchResponse = {
  results: RawgGame[];
};

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid RAWG id is required." }, { status: 400 });
  }

  try {
    const details = await fetchFromRawg<RawgDetailsResponse>(`/games/${id}`);
    const genreSlug = details.genres?.[0]?.slug;
    const parentPlatformId = details.parent_platforms?.[0]?.platform?.id;

    if (!genreSlug && !parentPlatformId) {
      return NextResponse.json({ results: [] });
    }

    const searchParams: Record<string, string | number> = { page_size: 12 };
    if (genreSlug) {
      searchParams.genres = genreSlug;
    }
    if (parentPlatformId) {
      searchParams.parent_platforms = parentPlatformId;
    }

    const data = await fetchFromRawg<RawgSearchResponse>("/games", searchParams);
    const results = (data.results ?? [])
      .filter((game) => game.id !== id)
      .slice(0, 10)
      .map((game) => ({
        id: game.id,
        slug: game.slug,
        name: game.name,
        background_image: game.background_image,
        rating: game.rating,
        released: game.released,
        playtime: game.playtime ?? 0,
        genres: game.genres?.map((genre) => ({ id: genre.id, name: genre.name, slug: genre.slug })) ?? [],
        parent_platforms:
          game.parent_platforms?.map((entry) => ({
            id: entry.platform.id,
            name: entry.platform.name,
            slug: entry.platform.slug,
          })) ?? [],
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("RAWG similar error", error);
    const message = error instanceof Error ? error.message : "Unable to load similar games.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
