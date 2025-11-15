const BASE_URL = process.env.RAWG_BASE_URL ?? "https://api.rawg.io/api";
const API_KEY = process.env.RAWG_API_KEY;

if (!API_KEY) {
  throw new Error("RAWG_API_KEY is not configured");
}

function buildUrl(path: string, searchParams: Record<string, string | number | undefined> = {}) {
  const url = new URL(path, BASE_URL);
  url.searchParams.set("key", API_KEY!);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function rawgFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = buildUrl(path, params);
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RAWG error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgGenre = {
  id: number;
  name: string;
  slug: string;
};

export type RawgGameSummary = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  playtime: number;
  parent_platforms?: { platform: { id: number; name: string; slug: string } }[];
  genres?: RawgGenre[];
  metacritic?: number | null;
};

export type RawgGameDetail = RawgGameSummary & {
  description?: string | null;
  description_raw?: string | null;
  background_image_additional?: string | null;
  esrb_rating?: { id: number; name: string; slug: string } | null;
  platforms?: RawgPlatform[];
  tags?: { id: number; name: string; slug: string }[];
  developers?: { id: number; name: string; slug: string }[];
  publishers?: { id: number; name: string; slug: string }[];
  stores?: {
    id: number;
    url: string | null;
    store: { id: number; name: string; slug: string; domain?: string | null };
  }[];
  website?: string | null;
  short_screenshots?: RawgScreenshot[];
};

export type RawgScreenshot = { id: number; image: string };

export type RawgMovie = {
  id: number;
  name: string;
  preview: string | null;
  data: { 480?: string; max?: string };
};

export type RawgSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGameSummary[];
};

export async function searchGamesRawg(
  query: string,
  page = 1,
  pageSize = 20,
  parentPlatform?: string | number,
): Promise<RawgSearchResponse> {
  const params: Record<string, string | number | undefined> = {
    search: query,
    page,
    page_size: pageSize,
  };
  if (parentPlatform) {
    params.parent_platforms = parentPlatform;
  }
  const data = await rawgFetch<RawgSearchResponse>("/games", params);
  return {
    count: data.count ?? data.results?.length ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: data.results ?? [],
  };
}

export async function getGameDetailsRawg(idOrSlug: string | number): Promise<RawgGameDetail> {
  return rawgFetch<RawgGameDetail>(`/games/${idOrSlug}`);
}

export async function getGameScreenshotsRawg(id: number): Promise<RawgScreenshot[]> {
  const data = await rawgFetch<{ results: RawgScreenshot[] }>(`/games/${id}/screenshots`);
  return data.results ?? [];
}

export async function getGameMoviesRawg(id: number): Promise<RawgMovie[]> {
  const data = await rawgFetch<{ results: RawgMovie[] }>(`/games/${id}/movies`);
  return data.results ?? [];
}

export async function getSimilarGamesByGenresRawg(game: RawgGameDetail, limit = 8): Promise<RawgGameSummary[]> {
  const firstGenre = game.genres?.[0];
  if (!firstGenre) return [];
  const data = await rawgFetch<{ results: RawgGameSummary[] }>("/games", {
    genres: String(firstGenre.id),
    page_size: limit,
    ordering: "-rating",
  });
  return (data.results ?? []).filter((candidate) => candidate.id !== game.id);
}

export type RawgParentPlatform = {
  id: number;
  name: string;
  slug: string;
  year_start?: number | null;
  image_background?: string | null;
};

export async function searchPlatforms(query = "", page = 1, pageSize = 40) {
  const params: Record<string, string | number | undefined> = {
    page,
    page_size: pageSize,
  };
  if (query) {
    params.search = query;
  }
  const data = await rawgFetch<{ results: RawgParentPlatform[] }>("/platforms/lists/parents", params);
  return data.results ?? [];
}

