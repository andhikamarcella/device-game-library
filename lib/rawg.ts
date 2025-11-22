import { fetchFromRawg } from "@/lib/server/rawgClient";

export type RawgPlatformRequirement = {
  minimum?: string;
  recommended?: string;
};

export type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  requirements?: RawgPlatformRequirement;
};

export type RawgPlatformSummary = {
  id: number;
  name: string;
  slug: string;
  year_start: number | null;
  image_background: string | null;
};

export type RawgEsrbRating = {
  id: number;
  name: string;
  slug: string;
};

export type RawgMetacriticPlatform = {
  metascore: number | null;
  url?: string | null;
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgStore = {
  id: number;
  url?: string | null;
  url_en?: string | null;
  url_ru?: string | null;
  store: {
    id: number;
    name: string;
    slug: string;
    domain?: string | null;
    games_count?: number | null;
    image_background?: string | null;
  };
};

export type RawgGame = {
  id: number;
  slug?: string | null;
  name: string;
  background_image: string | null;
  background_image_additional?: string | null;
  short_screenshots?: RawgScreenshot[];
  clip?: RawgClip | null;
  released: string | null;
  rating: number | null;
  ratings_count?: number;
  playtime?: number | null;
  platforms?: RawgPlatform[];
  tags?: RawgTag[] | null;
  stores?: RawgStore[] | null;
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

export type RawgReactionSummary = Record<string, number>;

export type RawgPlaytimeDistribution = Record<string, number>;

export type RawgRelatedGame = {
  id: number;
  slug?: string | null;
  name: string;
  background_image?: string | null;
  released?: string | null;
  rating?: number | null;
  ratings_count?: number | null;
  parent_platforms?: RawgParentPlatform[] | null;
};

export type RawgAchievement = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  percent: number | null;
};

export type RawgClip = {
  clip?: string | null;
  clips?: Record<string, string | undefined> | null;
  preview?: string | null;
  video?: string | null;
};

export type RawgGameDetails = RawgGame & {
  genres: { id: number; name: string }[];
  description?: string | null;
  description_raw?: string | null;
  website?: string | null;
  reddit_url?: string | null;
  reddit_name?: string | null;
  reddit_count?: number | null;
  twitch_count?: number | null;
  youtube_count?: number | null;
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
  added_by_status?: RawgAddedByStatus | null;
  ratings?: RawgRatingBreakdown[] | null;
  parent_game?: RawgParentGame;
  parent_platforms?: RawgParentPlatform[] | null;
  series?: RawgSeriesEntry[] | { results?: RawgSeriesEntry[] | null } | null;
  clip?: RawgClip | null;
  movies?: RawgMovie[] | null;
  esrb_rating?: RawgEsrbRating | null;
  metacritic?: number | null;
  metacritic_platforms?: RawgMetacriticPlatform[] | null;
  additions?: RawgRelatedGame[] | null;
  dlcs?: RawgRelatedGame[] | null;
  expansions?: RawgRelatedGame[] | null;
  reactions?: RawgReactionSummary | null;
  playtime_distribution?: RawgPlaytimeDistribution | null;
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

export async function getGameAchievements(id: number, pageSize = 10): Promise<RawgAchievement[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for achievements.");
  }

  const data = await fetchFromRawg<{ results: RawgAchievement[] }>(`/games/${id}/achievements`, {
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function getGameAdditions(id: number, pageSize = 6): Promise<RawgRelatedGame[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for related content.");
  }

  const data = await fetchFromRawg<{ results: RawgRelatedGame[] }>(`/games/${id}/additions`, {
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function getGameSeriesEntries(id: number, pageSize = 10): Promise<RawgRelatedGame[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for series data.");
  }

  const data = await fetchFromRawg<{ results: RawgRelatedGame[] }>(`/games/${id}/game-series`, {
    page_size: pageSize,
  });

  return data.results ?? [];
}

export type RawgSimilarGame = RawgGame & {
  slug: string;
  parent_platforms?: RawgParentPlatform[] | null;
};

type RawgSimilarStrategyDetails = {
  genres?: Array<{ slug?: string | null }> | null;
  parent_platforms?: RawgParentPlatform[] | null;
};

async function fetchSuggestedGames(id: number, limit: number): Promise<RawgSimilarGame[]> {
  const data = await fetchFromRawg<{ results: RawgSimilarGame[] }>(`/games/${id}/suggested`, {
    page_size: limit,
  });
  return data.results ?? [];
}

async function fetchStrategySimilarGames(id: number, limit: number): Promise<RawgSimilarGame[]> {
  const details = await fetchFromRawg<RawgSimilarStrategyDetails>(`/games/${id}`);
  const firstGenreSlug = details.genres?.find((genre) => genre?.slug)?.slug ?? null;
  const firstParentPlatformId = details.parent_platforms?.find((entry) => entry?.platform?.id)?.platform.id ?? null;

  if (!firstGenreSlug && !firstParentPlatformId) {
    return [];
  }

  const params: Record<string, string | number> = {
    page_size: Math.max(limit, 1),
    ordering: "-rating",
  };

  if (firstGenreSlug) {
    params.genres = firstGenreSlug;
  }

  if (firstParentPlatformId) {
    params.parent_platforms = firstParentPlatformId;
  }

  const data = await fetchFromRawg<{ results: RawgSimilarGame[] }>("/games", params);
  return data.results ?? [];
}

export async function getSimilarGamesForGame(id: number, limit = 6): Promise<RawgSimilarGame[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for similar games.");
  }

  const normalizedLimit = Math.max(1, limit);
  const filterGames = (games: RawgSimilarGame[] = []) =>
    games.filter((game) => game && Number.isFinite(game.id) && game.id !== id);

  try {
    const suggested = filterGames(await fetchSuggestedGames(id, normalizedLimit));
    if (suggested.length) {
      return suggested.slice(0, normalizedLimit);
    }
  } catch (error) {
    console.warn("RAWG suggested endpoint failed, falling back to genre/platform search", error);
  }

  try {
    const fallback = filterGames(await fetchStrategySimilarGames(id, normalizedLimit * 2));
    return fallback.slice(0, normalizedLimit);
  } catch (error) {
    console.error("RAWG fallback strategy failed", error);
    throw error instanceof Error ? error : new Error("Unable to load similar games.");
  }
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
