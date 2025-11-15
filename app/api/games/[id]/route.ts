import { NextResponse } from "next/server";
import { getGameDetails } from "@/lib/rawg";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid game id." }, { status: 400 });
  }

  try {
    const details = await getGameDetails(id);

    const response = {
      id: details.id,
      name: details.name,
      description: details.description_raw ?? details.description ?? "",
      backgroundImage: details.background_image,
      released: details.released,
      rating: details.rating,
      ratingsCount: details.ratings_count,
      website: details.website ?? null,
      genres: details.genres?.map((genre) => genre.name) ?? [],
      platforms: details.platforms?.map((entry) => entry.platform.name) ?? [],
      developers: details.developers?.map((developer) => developer.name) ?? [],
      publishers: details.publishers?.map((publisher) => publisher.name) ?? [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("RAWG detail error", error);
    const message = error instanceof Error ? error.message : "Unable to load game details.";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "Game not found." : message }, { status });
  }
}
