import { NextResponse } from "next/server";
import { normalizeRawgImageUrl } from "@/lib/images";
import { getSimilarGames } from "@/lib/rawg";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid RAWG id is required." }, { status: 400 });
  }

  try {
    const games = await getSimilarGames(id, 6);
    const results = games.map((game) => ({
      id: game.id,
      slug: game.slug,
      name: game.name,
      background_image: normalizeRawgImageUrl(game.background_image),
      rating: game.rating ?? null,
      released: game.released ?? null,
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
