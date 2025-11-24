import { NextResponse } from "next/server";

import { getIgdbToken, igdbRequest } from "@/lib/igdb";
import { igdbArtworkUrl, igdbCoverUrl, igdbScreenshotUrl, igdbThumbUrl } from "@/lib/igdbImages";

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
  artworks?: Array<{ id?: number; image_id?: string | null }>;
  videos?: Array<{ id?: number; video_id?: string | null }>;
  similar_games?: number[];
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
      artworks.image_id,
      screenshots.id,
      screenshots.image_id,
      videos.video_id,
      similar_games;
    where id = ${id};
    limit 1;
  `;

  try {
    const { accessToken, clientId } = await getIgdbToken();
    const igdbRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!igdbRes.ok) {
      const text = await igdbRes.text().catch(() => "");
      console.error("IGDB detail error", igdbRes.status, text);
      return NextResponse.json({ error: "IGDB game lookup failed" }, { status: 200 });
    }

    const data = (await igdbRes.json().catch(() => [])) as IgdbDetailRecord[];
    const game = data[0];

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    const coverImageUrl = igdbCoverUrl(game.cover?.image_id ?? null);
    const thumbnail = igdbThumbUrl(game.cover?.image_id ?? null) ?? coverImageUrl ?? null;
    const screenshotEntries = (game.screenshots ?? [])
      .map((shot, index) => {
        const url = igdbScreenshotUrl(shot.image_id ?? null);
        if (!url) {
          return null;
        }
        return {
          id: shot.id ?? index,
          url,
        };
      })
      .filter((entry): entry is { id: number; url: string } => Boolean(entry));

    const artworkEntries = (game.artworks ?? [])
      .map((art, index) => {
        const url = igdbArtworkUrl(art.image_id ?? null);
        if (!url) {
          return null;
        }
        return {
          id: art.id ?? index + (screenshotEntries.length || 0),
          url,
        };
      })
      .filter((entry): entry is { id: number; url: string } => Boolean(entry));

    const gallery = [...screenshotEntries, ...artworkEntries];
    const screenshotUrls = gallery.map((entry) => entry.url);
    const backgroundId = game.artworks?.[0]?.image_id ?? game.screenshots?.[0]?.image_id ?? game.cover?.image_id ?? null;
    const backgroundImage = backgroundId ? igdbScreenshotUrl(backgroundId) : coverImageUrl ?? null;
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

    const similarIds = Array.isArray(game.similar_games)
      ? game.similar_games.filter((value) => Number.isFinite(value))
      : [];

    const similarGames = similarIds.length
      ? await igdbRequest<
          Array<{
            id: number;
            name: string;
            cover?: { image_id?: string | null } | null;
            artworks?: Array<{ image_id?: string | null }>;
            screenshots?: Array<{ image_id?: string | null }>;
            first_release_date?: number | null;
            platforms?: Array<{ name?: string | null }>;
            rating?: number | null;
          }>
        >(
          `/games`,
          `
      fields
        name,
        cover.image_id,
        artworks.image_id,
        screenshots.image_id,
        first_release_date,
        platforms.name,
        rating;
      where id = (${similarIds.join(",")});
    `,
        )
      : [];

    const similarGameDetails = similarGames.map((entry) => {
      const artworkBackground = entry.artworks?.[0]?.image_id ?? entry.screenshots?.[0]?.image_id ?? null;
      return {
        id: entry.id,
        name: entry.name,
        rating: typeof entry.rating === "number" ? entry.rating : null,
        released: formatReleaseDate(entry.first_release_date),
        coverImage: igdbCoverUrl(entry.cover?.image_id ?? null),
        heroImage: artworkBackground ? igdbScreenshotUrl(artworkBackground) : null,
        platforms: (entry.platforms ?? [])
          .map((platform) => platform?.name?.trim())
          .filter((name): name is string => Boolean(name)),
      };
    });

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
      gallery,
      similarGames: similarGameDetails,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("IGDB detail error", error);
    return NextResponse.json({ error: "IGDB game lookup failed" }, { status: 200 });
  }
}
