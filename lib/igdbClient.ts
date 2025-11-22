import "server-only";
import { cache } from "react";
import { getIgdbToken } from "./igdb";

const IGDB_BASE_URL = process.env.IGDB_BASE_URL?.trim() || "https://api.igdb.com/v4";

export type IgdbEndpoint =
  | "games"
  | "screenshots"
  | "artworks"
  | "age_ratings"
  | "genres"
  | "themes"
  | "game_modes"
  | "player_perspectives"
  | "collections"
  | "franchises"
  | "involved_companies"
  | "language_supports"
  | "release_dates"
  | "videos"
  | "websites"
  | "time_to_beat"
  | "companies"
  | "platforms";

async function postIgdb(endpoint: IgdbEndpoint, body: string) {
  const { accessToken, clientId } = await getIgdbToken();
  const url = `${IGDB_BASE_URL}/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body,
    cache: "no-store",
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    throw new Error(`IGDB rate limited${retryAfter ? `, retry after ${retryAfter}s` : ""}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB request failed (${res.status}): ${text}`);
  }

  return res.json();
}

export const igdbPost = cache(postIgdb);

export type IgdbGameDetail = {
  id: number;
  name: string;
  slug?: string | null;
  summary?: string | null;
  storyline?: string | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  first_release_date?: number | null;
  platforms?: Array<{ id: number; name?: string | null; slug?: string | null }> | null;
  genres?: Array<{ id: number; name?: string | null }> | null;
  themes?: Array<{ id: number; name?: string | null }> | null;
  game_modes?: Array<{ id: number; name?: string | null }> | null;
  player_perspectives?: Array<{ id: number; name?: string | null }> | null;
  franchises?: Array<{ id: number; name?: string | null; slug?: string | null }> | null;
  collections?: Array<{ id: number; name?: string | null; slug?: string | null }> | null;
  involved_companies?: Array<{
    id: number;
    developer?: boolean;
    publisher?: boolean;
    company?: { id: number; name?: string | null; slug?: string | null } | null;
  }> | null;
  screenshots?: Array<{ id: number; image_id: string }> | null;
  artworks?: Array<{ id: number; image_id: string }> | null;
  videos?: Array<{ id?: number; name?: string | null; video_id: string }> | null;
  age_ratings?: Array<{ id: number; category?: number | null; rating?: number | null; synopsis?: string | null }> | null;
  release_dates?: Array<{ id: number; human?: string | null; platform?: number | null; region?: number | null; y?: number | null }> | null;
  websites?: Array<{ id: number; url: string; category?: number | null }> | null;
  language_supports?: Array<{
    id: number;
    language?: { id: number; name?: string | null } | null;
    audio?: number | null;
    subtitles?: number | null;
    interface?: number | null;
  }> | null;
  time_to_beat?: { normally?: number | null; hastly?: number | null; completely?: number | null } | null;
};

export async function fetchGameDetail(id: number) {
  const fields = [
    "name",
    "slug",
    "summary",
    "storyline",
    "aggregated_rating",
    "rating",
    "rating_count",
    "first_release_date",
    "platforms.name",
    "platforms.slug",
    "genres.name",
    "themes.name",
    "game_modes.name",
    "player_perspectives.name",
    "franchises.name",
    "franchises.slug",
    "collections.name",
    "collections.slug",
    "involved_companies.*",
    "involved_companies.company.name",
    "involved_companies.company.slug",
    "involved_companies.developer",
    "involved_companies.publisher",
    "screenshots.image_id",
    "artworks.image_id",
    "videos.*",
    "age_ratings.*",
    "age_ratings.id",
    "age_ratings.category",
    "age_ratings.rating",
    "age_ratings.synopsis",
    "release_dates.*",
    "websites.*",
    "language_supports.*",
    "language_supports.language.name",
    "language_supports.audio",
    "language_supports.subtitles",
    "language_supports.interface",
    "time_to_beat.*",
  ];
  const query = [`fields ${fields.join(", ")};`, `where id = ${id};`, "limit 1;"].join("\n");
  const [game] = (await igdbPost("games", query)) as IgdbGameDetail[];
  return game;
}

export async function fetchCollection({
  endpoint,
  query,
}: {
  endpoint: IgdbEndpoint;
  query: string;
}) {
  return igdbPost(endpoint, query);
}
