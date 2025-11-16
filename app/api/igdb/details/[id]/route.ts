import { NextResponse } from "next/server";
import { normalizeImageUrl } from "@/lib/images";
import { getGameDetails } from "@/lib/gameData";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid IGDB id is required." }, { status: 400 });
  }

  try {
    const data = await getGameDetails(id);
    return NextResponse.json({
      id: data.id,
      slug: data.slug ?? data.id.toString(),
      name: data.name,
      description_raw: data.description_raw,
      background_image: normalizeImageUrl(data.background_image),
      background_image_additional: normalizeImageUrl(data.background_image_additional),
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
      genres: data.genres?.map((genre) => ({ id: genre.id, name: genre.name, slug: slugifyName(genre.name) })) ?? [],
      tags: data.tags?.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug ?? slugifyName(tag.name) })) ?? [],
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
      short_screenshots:
        data.short_screenshots?.map((shot) => ({
          ...shot,
          image: normalizeImageUrl(shot.image),
        })) ?? [],
    });
  } catch (error) {
    console.error("IGDB details error", error);
    const message = error instanceof Error ? error.message : "Unable to load IGDB game.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const slugifyName = (name?: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};
