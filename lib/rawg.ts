const RAWG_API_BASE_URL = process.env.RAWG_BASE_URL ?? "https://api.rawg.io/api";

const resolveApiKey = () => {
  const key = process.env.NEXT_PUBLIC_RAWG_API_KEY ?? process.env.RAWG_API_KEY;
  if (!key) {
    throw new Error("RAWG API key is not configured. Set NEXT_PUBLIC_RAWG_API_KEY in your environment.");
  }
  return key;
};

export type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgParentPlatform = {
  id: number;
  name: string;
  slug: string;
  year_start?: number | null;
  image_background?: string | null;
};

export type RawgGenre = {
  id: number;
  name: string;
  slug: string;
};

export type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  playtime: number;
  parent_platforms?: { platform: RawgParentPlatform }[];
  genres?: RawgGenre[];
  metacritic?: number | null;
};

export type RawgGameDetails = RawgGame & {
  description_raw?: string | null;
  description?: string | null;
  background_image_additional?: string | null;
  website?: string | null;
  platforms?: RawgPlatform[];
  tags?: { id: number; name: string; slug: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  stores?: { id: number; store: { id: number; name: string; domain: string | null } }[];
  esrb_rating?: { id: number; name: string } | null;
};

export type RawgScreenshot = {
  id: number;
  image: string;
  width: number;
  height: number;
};

export type RawgMovie = {
  id: number;
  name: string;
  preview: string | null;
  data: {
    max: string | null;
    '480'?: string | null;
  };
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

export type RawgSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
};

async function fetchFromRawg<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const apiKey = resolveApiKey();
  const url = new URL(`${RAWG_API_BASE_URL}${path}`);
  url.searchParams.set("key", apiKey);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body && (body.detail || body.error || body.message)) ||
      `RAWG request to ${path} failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export type SearchOptions = {
  page?: number;
  pageSize?: number;
  platformId?: number;
  ordering?: string;
};

export async function searchGames(query: string, options: SearchOptions = {}): Promise<RawgSearchResponse> {
  const { page = 1, pageSize = 20, platformId, ordering } = options;
  const trimmedQuery = query.trim();

  if (!trimmedQuery && !platformId) {
    throw new Error("Please provide a search query or select a platform.");
  }

  const params: Record<string, string | number | undefined> = {
    search: trimmedQuery || undefined,
    page,
    page_size: pageSize,
    ordering,
    parent_platforms: platformId,
  };

  return fetchFromRawg<RawgSearchResponse>("/games", params);
}

export async function getGameDetails(idOrSlug: number | string): Promise<RawgGameDetails> {
  if (typeof idOrSlug === "number" && !Number.isFinite(idOrSlug)) {
    throw new Error("A valid RAWG game id must be provided.");
  }

  return fetchFromRawg<RawgGameDetails>(`/games/${idOrSlug}`);
}

export async function getGameScreenshots(id: number, page = 1, pageSize = 12): Promise<RawgScreenshot[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for screenshots.");
  }

  const data = await fetchFromRawg<{ results: RawgScreenshot[] }>(`/games/${id}/screenshots`, {
    page,
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function getGameMovies(id: number): Promise<RawgMovie[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for movies.");
  }

  const data = await fetchFromRawg<{ results: RawgMovie[] }>(`/games/${id}/movies`);
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

export async function getSimilarGames(id: number, page = 1, pageSize = 6): Promise<RawgGame[]> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid RAWG game id must be provided for similar games.");
  }

  const data = await fetchFromRawg<RawgSearchResponse>(`/games/${id}/suggested`, {
    page,
    page_size: pageSize,
  });

  return data.results ?? [];
}

export async function searchPlatforms(query = "", page = 1, pageSize = 50) {
  const data = await fetchFromRawg<{ results: RawgParentPlatform[] }>("/platforms", {
    search: query || undefined,
    page,
    page_size: pageSize,
  });

  return data.results ?? [];
}
