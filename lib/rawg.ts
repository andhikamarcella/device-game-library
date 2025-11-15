const RAWG_API_BASE_URL = "https://api.rawg.io/api";

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
  name: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  ratings_count: number;
  platforms: RawgPlatform[];
};

export type RawgGameDetails = RawgGame & {
  description?: string | null;
  description_raw?: string | null;
  website?: string | null;
  genres: { id: number; name: string }[];
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
};

function getApiKey(): string {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    throw new Error("RAWG_API_KEY environment variable is not configured.");
  }
  return apiKey;
}

async function fetchFromRawg<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${RAWG_API_BASE_URL}${path}`);

  url.searchParams.set("key", apiKey);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && (errorBody.detail || errorBody.error || errorBody.message)) ||
      `RAWG request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

/**
 * Search for games on RAWG by text query.
 */
type SearchGamesOptions = {
  page?: number;
  pageSize?: number;
  platformId?: number;
};

export async function searchGames(query: string, options: SearchGamesOptions = {}): Promise<RawgGame[]> {
  if (!query.trim()) {
    return [];
  }

  const { page = 1, pageSize = 20, platformId } = options;

  const data = await fetchFromRawg<{ results: RawgGame[] }>("/games", {
    search: query,
    page,
    page_size: pageSize,
    platforms: platformId,
  });

  return data.results ?? [];
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
