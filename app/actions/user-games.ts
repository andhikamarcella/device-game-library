"use server";

import { revalidatePath } from "next/cache";
import { upsertUserGame, updateUserGame, getUserGameByRawgId } from "@/lib/user-games";
import type { UserGameRow } from "@/lib/user-games";

type AddGamePayload = {
  rawgId: number;
  slug: string;
  title: string;
  coverImage?: string | null;
  platforms?: string[];
  genres?: string[];
  released?: string | null;
  rating?: number | null;
  ratingsCount?: number | null;
  playtime?: number | null;
};

type UpdateGamePayload = {
  id: string;
  ownership?: UserGameRow["ownership"];
  status?: UserGameRow["status"];
  personal_rating?: number | null;
  playtime_hours?: number | null;
  last_played_at?: string | null;
  notes?: string | null;
  cover_image?: string | null;
  platforms?: string[] | null;
  genres?: string[] | null;
};

const pathsToRevalidate = ["/", "/games", "/dashboard", "/library"];

function triggerRevalidation(rawgId: number) {
  pathsToRevalidate.forEach((path) => revalidatePath(path));
  revalidatePath(`/games/${rawgId}`);
}

export async function addGameToLibraryAction(payload: AddGamePayload) {
  const { rawgId, slug, title, coverImage, platforms, genres, released, rating, ratingsCount, playtime } = payload;

  if (!rawgId || !slug || !title) {
    throw new Error("RAWG metadata is required to add a game.");
  }

  const insertResult = await upsertUserGame({
    rawg_id: rawgId,
    slug,
    title,
    cover_image: coverImage ?? null,
    platforms: platforms?.length ? platforms : null,
    genres: genres?.length ? genres : null,
    released: released ?? null,
    rawg_rating: typeof rating === "number" ? rating : null,
    rawg_ratings_count: typeof ratingsCount === "number" ? ratingsCount : null,
    rawg_playtime: typeof playtime === "number" ? playtime : null,
  });

  triggerRevalidation(rawgId);
  return insertResult;
}

export async function updateUserGameAction(payload: UpdateGamePayload) {
  const { id, ...updates } = payload;
  if (!id) {
    throw new Error("A library entry id is required for updates.");
  }

  const updated = await updateUserGame(id, updates);
  triggerRevalidation(updated.rawg_id);
  return updated;
}

export async function ensureUserGame(rawgId: number) {
  if (!rawgId) {
    throw new Error("A RAWG id is required.");
  }

  const existing = await getUserGameByRawgId(rawgId);
  if (existing) {
    return existing;
  }

  throw new Error("Game is not in your library.");
}
