import { NextResponse } from "next/server";

import { getIgdbToken, igdbRequest } from "@/lib/igdb";
import { igdbCoverUrl, igdbImage, igdbThumbUrl } from "@/lib/igdbImages";

type Params = { params: { id: string } };

type IgdbDetailRecord = {
  id: number;
  name: string;
  summary?: string | null;
  storyline?: string | null;
  release_dates?: Array<{ id?: number; y?: number | null; date?: number | null }>;
  platforms?: Array<{ id: number; name?: string | null }>;
  genres?: Array<{ id: number; name?: string | null }>;
  themes?: Array<{ id: number; name?: string | null }>;
  game_modes?: Array<{ id: number; name?: string | null }>;
  player_perspectives?: Array<{ id: number; name?: string | null }>;
  cover?: { id?: number; image_id?: string | null };
  screenshots?: Array<{ id?: number; image_id?: string | null }>;
  artworks?: Array<{ id?: number; image_id?: string | null }>;
  videos?: Array<{ id?: number; video_id?: string | null }>;
  age_ratings?: Array<{ id?: number; rating?: number | null }>;
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
      artworks.image_id,
      screenshots.image_id,
      cover.image_id,
      genres.name,
      themes.name,
      game_modes.name,
      player_perspectives.name,
      release_dates.y,
      release_dates.date,
      platforms.name,
      summary,
      storyline,
      videos.video_id,
      age_ratings.rating,
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

    const coverImageId = game.cover?.image_id ?? null;
    const thumbnail = igdbThumbUrl(coverImageId) ?? (coverImageId ? igdbImage(coverImageId, "t_cover_big") : null);
    const screenshotEntries = (game.screenshots ?? [])
      .map((shot) => ({
        image_id: shot?.image_id ?? null,
      }))
      .filter((entry): entry is { image_id: string } => Boolean(entry.image_id));

    const artworkEntries = (game.artworks ?? [])
      .map((art) => ({
        image_id: art?.image_id ?? null,
      }))
      .filter((entry): entry is { image_id: string } => Boolean(entry.image_id));

    const screenshotUrls = screenshotEntries.map((entry) => igdbImage(entry.image_id, "t_screenshot_big"));
    const artworkUrls = artworkEntries.map((entry) => igdbImage(entry.image_id, "t_1080p"));
    const backgroundId =
      game.artworks?.[0]?.image_id ?? game.screenshots?.[0]?.image_id ?? game.cover?.image_id ?? null;
    const backgroundImage = backgroundId ? igdbImage(backgroundId, "t_screenshot_huge") : null;
    const description = game.storyline ?? game.summary ?? "";
    const summary = game.summary ?? "";
    const platforms = (game.platforms ?? [])
      .map((platform) => platform?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const genres = (game.genres ?? [])
      .map((genre) => genre?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const themes = (game.themes ?? [])
      .map((theme) => theme?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const gameModes = (game.game_modes ?? [])
      .map((mode) => mode?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const playerPerspectives = (game.player_perspectives ?? [])
      .map((perspective) => perspective?.name?.trim())
      .filter((name): name is string => Boolean(name));

    const videos = (game.videos ?? [])
      .map((video) => ({
        video_id: video?.video_id ?? null,
      }))
      .filter((entry): entry is { video_id: string } => Boolean(entry.video_id));

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
        heroImage: artworkBackground ? igdbImage(artworkBackground, "t_screenshot_huge") : null,
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
      released: formatReleaseDate(game.release_dates?.[0]?.date ?? null),
      rating: null,
      ratingsCount: 0,
      website: null,
      genres,
      themes,
      game_modes: gameModes,
      player_perspectives: playerPerspectives,
      platforms,
      developers: [] as string[],
      publishers: [] as string[],
      coverImageUrl: coverImageId ? igdbImage(coverImageId, "t_cover_big") : null,
      screenshotUrls,
      artworkUrls,
      gallery: [...screenshotEntries, ...artworkEntries],
      artworks: artworkEntries,
      screenshots: screenshotEntries,
      cover: coverImageId ? { image_id: coverImageId } : null,
      videos,
      similarGames: similarGameDetails,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("IGDB detail error", error);
    return NextResponse.json({ error: "IGDB game lookup failed" }, { status: 200 });
  }
}
