import { NextResponse } from "next/server";
import { searchGames } from "@/lib/rawg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number.parseInt(pageParam, 10) || 1 : 1;

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });
  }

  try {
    const games = await searchGames(query, page);
    const results = games.map((game) => {
      const releaseYear = game.released ? Number.parseInt(game.released.slice(0, 4), 10) : null;
      return {
        id: game.id,
        name: game.name,
        coverImage: game.background_image,
        releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
        rating: game.rating ?? null,
        ratingsCount: game.ratings_count ?? 0,
        platforms: game.platforms.map((entry) => entry.platform.name).filter(Boolean),
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("RAWG search error", error);
    const message = error instanceof Error ? error.message : "Unable to search games.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
