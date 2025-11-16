import { NextResponse } from "next/server";

import { getIgdbImageUrl, igdbRequest } from "@/lib/igdb";

type Params = { params: { id: string } };

type IgdbDetailRecord = {
  id: number;
  name: string;
  summary?: string | null;
  storyline?: string | null;
  first_release_date?: number | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  aggregated_rating_count?: number | null;
  rating_count?: number | null;
  platforms?: Array<{ id: number; name?: string | null }>;
  genres?: Array<{ id: number; name?: string | null }>;
  cover?: { image_id?: string | null };
  screenshots?: Array<{ id?: number; image_id?: string | null }>;
};

const formatReleaseDate = (timestamp?: number | null): string | null => {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split("T")[0] ?? null;
};

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid game id." }, { status: 400 });
  }

  const query = `
    fields
      id,
      name,
      summary,
      storyline,
      first_release_date,
      aggregated_rating,
      rating,
      aggregated_rating_count,
      rating_count,
      platforms.id,
      platforms.name,
      genres.id,
      genres.name,
      cover.image_id,
      screenshots.id,
      screenshots.image_id;
    where id = ${id};
    limit 1;
  `;

  try {
    const data = await igdbRequest<IgdbDetailRecord[]>("games", query);
    const game = data[0];

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    const coverImageUrl = getIgdbImageUrl(game.cover?.image_id, "cover");
    const screenshotEntries = (game.screenshots ?? [])
      .map((shot, index) => {
        const url = getIgdbImageUrl(shot.image_id, "screenshot");
        if (!url) {
          return null;
        }
        return {
          id: shot.id ?? index,
          url,
        };
      })
      .filter((entry): entry is { id: number; url: string } => Boolean(entry));

    const screenshotUrls = screenshotEntries.map((entry) => entry.url);
    const thumbnail = coverImageUrl ?? screenshotUrls[0] ?? null;
    const backgroundImage = screenshotUrls[0] ?? coverImageUrl ?? null;
    const description = game.storyline ?? game.summary ?? "";
    const summary = game.summary ?? "";
    const rating =
      typeof game.aggregated_rating === "number"
        ? game.aggregated_rating
        : typeof game.rating === "number"
          ? game.rating
          : null;
    const ratingsCount =
      typeof game.aggregated_rating_count === "number"
        ? game.aggregated_rating_count
        : typeof game.rating_count === "number"
          ? game.rating_count
          : 0;
    const platforms = (game.platforms ?? [])
      .map((platform) => platform?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const genres = (game.genres ?? [])
      .map((genre) => genre?.name?.trim())
      .filter((name): name is string => Boolean(name));

    const response = {
      id: game.id,
      name: game.name,
      description,
      summary,
      thumbnail,
      backgroundImage,
      released: formatReleaseDate(game.first_release_date),
      rating,
      ratingsCount,
      website: null,
      genres,
      platforms,
      developers: [] as string[],
      publishers: [] as string[],
      coverImageUrl,
      screenshotUrls,
      gallery: screenshotEntries,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("IGDB detail error", error);
    const message = error instanceof Error ? error.message : "Unable to load game details.";
    const status = /404/.test(message) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "Game not found." : message }, { status });
  }
}
