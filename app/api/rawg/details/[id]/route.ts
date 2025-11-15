import { NextResponse } from "next/server";
import { fetchFromRawg } from "@/lib/server/rawgClient";

type RawgDetailsResponse = {
  id: number;
  slug: string;
  name: string;
  description_raw: string | null;
  background_image: string | null;
  background_image_additional: string | null;
  released: string | null;
  playtime: number | null;
  metacritic: number | null;
  esrb_rating: { id: number; name: string } | null;
  parent_platforms?: Array<{ platform: { id: number; name: string; slug: string } }>;
  genres?: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
  developers?: Array<{ id: number; name: string }>; 
  publishers?: Array<{ id: number; name: string }>;
  stores?: Array<{ store: { id: number; name: string; domain: string | null; slug: string } }>;
  rating: number | null;
  ratings_count: number | null;
};

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid RAWG id is required." }, { status: 400 });
  }

  try {
    const data = await fetchFromRawg<RawgDetailsResponse>(`/games/${id}`);
    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      name: data.name,
      description_raw: data.description_raw,
      background_image: data.background_image,
      background_image_additional: data.background_image_additional,
      released: data.released,
      playtime: data.playtime,
      metacritic: data.metacritic,
      esrb_rating: data.esrb_rating,
      parent_platforms:
        data.parent_platforms?.map((entry) => ({
          id: entry.platform.id,
          name: entry.platform.name,
          slug: entry.platform.slug,
        })) ?? [],
      genres: data.genres?.map((genre) => ({ id: genre.id, name: genre.name, slug: genre.slug })) ?? [],
      tags: data.tags?.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })) ?? [],
      developers: data.developers?.map((dev) => ({ id: dev.id, name: dev.name })) ?? [],
      publishers: data.publishers?.map((pub) => ({ id: pub.id, name: pub.name })) ?? [],
      stores:
        data.stores?.map((store) => ({
          id: store.store.id,
          name: store.store.name,
          domain: store.store.domain ?? null,
          slug: store.store.slug,
        })) ?? [],
      rating: data.rating,
      ratings_count: data.ratings_count,
    });
  } catch (error) {
    console.error("RAWG details error", error);
    const message = error instanceof Error ? error.message : "Unable to load RAWG game.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
