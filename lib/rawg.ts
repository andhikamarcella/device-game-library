import { fetchFromRawg } from "@/lib/server/rawgClient";

export type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgPlatformSummary = {
  id: number;
  name: string;
  slug: string;
  year_start: number | null;
  image_background: string | null;
};

export type RawgGame = {
  id: number;
  slug?: string | null;
  name: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  ratings_count: number;
  platforms?: RawgPlatform[];
};

export type RawgAddedByStatus = Partial<
  Record<
    | "yet"
    | "owned"
    | "beaten"
    | "toplay"
    | "dropped"
    | "playing"
    | "completed"
    | "wishlist"
    | "custom"
    | "collecting"
    | "main"
    | "replay"
    | "paused",
    number
  >
>;

export type RawgRatingBreakdown = {
  id: number;
  title: string;
  count: number;
  percent: number;
};

export type RawgTag = {
  id: number;
  name: string;
  slug?: string | null;
};

export type RawgSeriesEntry = {
  id: number;
  name: string;
  slug?: string | null;
};

export type RawgParentGame = RawgSeriesEntry | null;

export type RawgParentPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgGameDetails = RawgGame & {
  description?: string | null;
  description_raw?: string | null;
  website?: string | null;
  genres: { id: number; name: string }[];
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
  background_image_additional?: string | null;
  short_screenshots?: RawgScreenshot[];
  playtime?: number | null;
  added_by_status?: RawgAddedByStatus | null;
  ratings?: RawgRatingBreakdown[] | null;
  tags?: RawgTag[] | null;
  parent_game?: RawgParentGame;
  parent_platforms?: RawgParentPlatform[] | null;
  series?: RawgSeriesEntry[] | { results?: RawgSeriesEntry[] | null } | null;
};

export type RawgMovie = {
  id: number;
  name: string;
  preview: string | null;
  data: Record<string, string | undefined> & { 480?: string; max?: string };
};

export type RawgScreenshot = {
  id: number;
  image: string;
  width?: number;
  height?: number;
};

export type RawgReview = {
  id: number;
  text?: string | null;
  rating?: number | string | null;
  created?: string | null;
  user?: {
    username?: string | null;
  } | null;
};

/**
 * Search for games on RAWG by text query.
 */
type SearchGamesOptions = {
  page?: number;
  pageSize?: number;
  platformId?: number;
  ordering?: string;
};

export type RawgSearchResponse = {
  results: RawgGame[];
  count: number;
  next: string | null;
  previous: string | null;
};

export async function searchGames(query: string, options: SearchGamesOptions = {}): Promise<RawgSearchResponse> {
  const { page = 1, pageSize = 20, platformId, ordering = "-rating" } = options;
  const trimmedQuery = query.trim();

  if (!trimmedQuery && !platformId) {
    throw new Error("Provide a search term or choose a platform to browse games.");
  }

  const params: Record<string, string | number | undefined> = {
    page,
    page_size: pageSize,
    ordering,
    platforms: platformId,
  };

  if (trimmedQuery) {
    params.search = trimmedQuery;
  }

  const data = await fetchFromRawg<RawgSearchResponse>("/games", params);

  return {
    results: data.results ?? [],
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
  };
}

/**
 * Fetch detailed information for a single RAWG game.
 */
export async function getGameDetails(id: number): Promise<RawgGameDetails> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided.");
  }

  return fetchFromRawg<RawgGameDetails>(`/games/${id}`);
}

export async function getGameScreenshots(
  id: number,
  page = 1,
  pageSize = 12,
): Promise<RawgScreenshot[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for screenshots.");
  }

  const data = await fetchFromRawg<{ results: RawgScreenshot[] }>(`/games/${id}/screenshots`, {
    page,
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function getGameReviews(id: number, page = 1, pageSize = 6): Promise<RawgReview[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for reviews.");
  }

  const data = await fetchFromRawg<{ results: RawgReview[] }>(`/games/${id}/reviews`, {
    page,
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function getGameTrailers(id: number): Promise<RawgMovie[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for trailers.");
  }

  const data = await fetchFromRawg<{ results: RawgMovie[] }>(`/games/${id}/movies`);

  return data.results ?? [];
}

export type RawgSimilarGame = RawgGame & {
  slug: string;
  parent_platforms?: RawgParentPlatform[] | null;
};

export async function getSimilarGames(id: number, limit = 6): Promise<RawgSimilarGame[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for similar games.");
  }

  const data = await fetchFromRawg<{ results: RawgSimilarGame[] }>(`/games/${id}/suggested`, {
    page_size: limit,
  });

  return (data.results ?? []).slice(0, limit);
}

/**
 * Retrieve a list of RAWG platforms, optionally filtered by a search query.
 */
export async function searchPlatforms(query = "", page = 1, pageSize = 40): Promise<RawgPlatformSummary[]> {
  const data = await fetchFromRawg<{ results: RawgPlatformSummary[] }>("/platforms", {
    search: query || undefined,
    page,
    page_size: pageSize,
    ordering: "-games_count",
  });

  return data.results ?? [];
}
