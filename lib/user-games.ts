import { createServerSupabaseClient } from "./supabase/server";
import type { Database } from "./supabase/types";

const DEFAULT_USER_ID = process.env.DG_TRACKER_DEFAULT_USER_ID ?? "00000000-0000-0000-0000-000000000000";

const resolveUserId = (userId?: string | null) => userId ?? DEFAULT_USER_ID;

export type UserGameRow = Database["public"]["Tables"]["user_games"]["Row"];
export type UserGameInsert = Database["public"]["Tables"]["user_games"]["Insert"];
export type UserGameUpdate = Database["public"]["Tables"]["user_games"]["Update"];

export type LibraryFilters = {
  ownership?: UserGameRow["ownership"][];
  status?: UserGameRow["status"][];
  platform?: string | null;
  minRating?: number | null;
  search?: string | null;
  userId?: string | null;
};

export async function listUserGames(filters: LibraryFilters = {}): Promise<UserGameRow[]> {
  const supabase = createServerSupabaseClient();
  const userId = resolveUserId(filters.userId);
  let query = supabase
    .from("user_games")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (filters.ownership?.length) {
    query = query.in("ownership", filters.ownership);
  }

  if (filters.status?.length) {
    query = query.in("status", filters.status);
  }

  if (filters.platform) {
    query = query.contains("platforms", [filters.platform]);
  }

  if (typeof filters.minRating === "number") {
    query = query.gte("personal_rating", filters.minRating);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load library: ${error.message}`);
  }

  return data ?? [];
}

export async function getUserGameByRawgId(rawgId: number): Promise<UserGameRow | null> {
  const supabase = createServerSupabaseClient();
  const userId = resolveUserId();
  const { data, error } = await supabase
    .from("user_games")
    .select("*")
    .eq("rawg_id", rawgId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to load library entry: ${error.message}`);
  }

  return data ?? null;
}

export async function upsertUserGame(payload: UserGameInsert): Promise<UserGameRow> {
  const supabase = createServerSupabaseClient();
  const userId = resolveUserId(payload.user_id);
  const { data, error } = await supabase
    .from("user_games")
    .upsert({ ...payload, user_id: userId }, { onConflict: "rawg_id,user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save game: ${error.message}`);
  }

  return data;
}

export async function updateUserGame(id: string, updates: UserGameUpdate): Promise<UserGameRow> {
  const supabase = createServerSupabaseClient();
  const userId = resolveUserId(updates.user_id);
  const { data, error } = await supabase
    .from("user_games")
    .update({ ...updates, user_id: userId })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update game: ${error.message}`);
  }

  return data;
}

export type LibraryStats = {
  totalGames: number;
  totalCompleted: number;
  totalPlaying: number;
  totalWishlist: number;
  totalPlaytime: number;
  mostCommonPlatform: string | null;
  topGenres: string[];
};

export async function getLibraryStats(): Promise<LibraryStats> {
  const supabase = createServerSupabaseClient();
  const userId = resolveUserId();
  const { data, error } = await supabase
    .from("user_games")
    .select("platforms, status, ownership, playtime_hours, genres")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to calculate stats: ${error.message}`);
  }

  const rows = data ?? [];
  const totalGames = rows.length;
  let totalCompleted = 0;
  let totalPlaying = 0;
  let totalWishlist = 0;
  let totalPlaytime = 0;
  const platformCount = new Map<string, number>();
  const genreCount = new Map<string, number>();

  rows.forEach((row) => {
    if (row.status === "completed") {
      totalCompleted += 1;
    }
    if (row.status === "playing") {
      totalPlaying += 1;
    }
    if (row.ownership === "wishlist") {
      totalWishlist += 1;
    }
    totalPlaytime += row.playtime_hours ?? 0;

    (row.platforms ?? []).forEach((platform) => {
      if (!platform) return;
      platformCount.set(platform, (platformCount.get(platform) ?? 0) + 1);
    });

    (row.genres ?? []).forEach((genre) => {
      if (!genre) return;
      genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1);
    });
  });

  const mostCommonPlatform = [...platformCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);

  return {
    totalGames,
    totalCompleted,
    totalPlaying,
    totalWishlist,
    totalPlaytime,
    mostCommonPlatform,
    topGenres,
  };
}
