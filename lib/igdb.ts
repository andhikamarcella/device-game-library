const IGDB_BASE_URL = process.env.IGDB_BASE_URL?.trim() || "https://api.igdb.com/v4";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID?.trim();
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET?.trim();

type TokenCache = {
  accessToken: string;
  expiresAt: number;
  clientId: string;
};

let tokenCache: TokenCache | null = null;

const resolveTokenUrl = (): string => {
  const fallbackUrl = "https://id.twitch.tv/oauth2/token";
  const rawUrl =
    process.env.IGDB_TOKEN_URL?.trim() || process.env.TWITCH_TOKEN_URL?.trim() || fallbackUrl;

  return rawUrl.trim();
};

export async function getIgdbToken(): Promise<{ accessToken: string; clientId: string }> {
  const clientId = TWITCH_CLIENT_ID;
  const clientSecret = TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment variables");
    throw new Error("Missing Twitch credentials");
  }

  const now = Date.now();
  if (tokenCache && tokenCache.clientId === clientId && now < tokenCache.expiresAt - 60_000) {
    return { accessToken: tokenCache.accessToken, clientId };
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "client_credentials");

  const tokenUrl = resolveTokenUrl();
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Failed to fetch IGDB token", tokenUrl, res.status, text);
    throw new Error(`Failed to fetch IGDB token: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
    clientId,
  };

  return { accessToken: data.access_token, clientId };
}

export type SortKey =
  | "none"
  | "most_popular"
  | "highest_rated"
  | "newest"
  | "oldest"
  | "alphabetical";

export function buildIgdbQuery(opts: {
  searchText?: string;
  sort?: SortKey;
  platformId?: number | null;
}): string {
  const lines: string[] = [];

  lines.push(
    [
      "fields",
      "  id,",
      "  name,",
      "  summary,",
      "  total_rating,",
      "  total_rating_count,",
      "  first_release_date,",
      "  cover.image_id,",
      "  screenshots.image_id,",
      "  platforms.name;",
    ].join("\n"),
  );

  const trimmedSearch = opts.searchText?.trim();
  if (trimmedSearch) {
    const escaped = trimmedSearch.replace(/"/g, '\\"');
    lines.push(`search "${escaped}";`);
  }

  if (typeof opts.platformId === "number") {
    lines.push(`where platforms = (${opts.platformId});`);
  }

  const sortMapping: Record<Exclude<SortKey, "none">, string> = {
    most_popular: "total_rating_count desc",
    highest_rated: "total_rating desc",
    newest: "first_release_date desc",
    oldest: "first_release_date asc",
    alphabetical: "name asc",
  };

  const sortKey = opts.sort ?? "none";
  const sortExpr = sortKey === "none" ? null : sortMapping[sortKey as Exclude<SortKey, "none">];
  if (sortExpr) {
    lines.push(`sort ${sortExpr};`);
  }

  lines.push("limit 50;");

  return lines.join("\n");
}

export interface IgdbCover {
  id: number;
  image_id: string;
}

export interface IgdbImageAsset {
  id: number;
  image_id: string;
  width?: number;
  height?: number;
}

export interface IgdbPlatformRef {
  id: number;
  name?: string;
  abbreviation?: string | null;
  slug?: string | null;
}

export interface IgdbGenreRef {
  id: number;
  name?: string;
}

export interface IgdbKeywordRef {
  id: number;
  name?: string;
  slug?: string;
}

export interface IgdbModeRef {
  id: number;
  name?: string;
}

export interface IgdbWebsite {
  id: number;
  url: string;
  category?: number;
}

export interface IgdbVideo {
  id?: number;
  name?: string;
  video_id: string;
}

export interface IgdbAchievementIcon {
  id?: number;
  image_id?: string | null;
}

export interface IgdbAchievement {
  id: number;
  name?: string | null;
  description?: string | null;
  instructions?: string | null;
  achievement_icon?: IgdbAchievementIcon | null;
  locked_icon?: IgdbAchievementIcon | null;
  unlocked_icon?: IgdbAchievementIcon | null;
}

export interface IgdbCompanyRef {
  id: number;
  company?: {
    id: number;
    name?: string;
  };
  developer?: boolean;
  publisher?: boolean;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string | null;
  first_release_date?: number | null;
  total_rating?: number | null;
  total_rating_count?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  cover?: IgdbCover;
  platforms?: IgdbPlatformRef[];
  genres?: IgdbGenreRef[];
  screenshots?: IgdbImageAsset[];
}

export interface IgdbGameDetails extends IgdbGame {
  storyline?: string | null;
  themes?: IgdbGenreRef[];
  keywords?: IgdbKeywordRef[];
  game_modes?: IgdbModeRef[];
  player_perspectives?: IgdbModeRef[];
  websites?: IgdbWebsite[];
  videos?: IgdbVideo[];
  screenshots?: IgdbImageAsset[];
  artworks?: IgdbImageAsset[];
  similar_games?: IgdbSimilarGame[];
  dlcs?: IgdbSimilarGame[];
  expansions?: IgdbSimilarGame[];
  remakes?: IgdbSimilarGame[];
  remasters?: IgdbSimilarGame[];
  parent_game?: IgdbSimilarGame;
  involved_companies?: IgdbCompanyRef[];
}

export interface IgdbSimilarGame
  extends Pick<IgdbGame, "id" | "name" | "slug" | "total_rating" | "total_rating_count"> {
  cover?: IgdbCover;
  platforms?: IgdbPlatformRef[];
  screenshots?: IgdbImageAsset[];
}

export interface IgdbSearchParams {
  search?: string;
  ordering?: string;
  platforms?: string;
  genres?: string;
  tags?: string;
  dates?: string;
  metacritic?: string;
  page?: number;
  page_size?: number;
}

export interface IgdbSearchResponse {
  results: IgdbGame[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IgdbPlatformSummary {
  id: number;
  name: string;
  slug?: string;
  abbreviation?: string | null;
  generation?: number | null;
}

export function getIgdbImageUrl(
  imageId?: string | null,
  type: "cover" | "screenshot" = "cover",
): string | null {
  if (!imageId) {
    return null;
  }
  const size = type === "cover" ? "t_cover_big" : "t_screenshot_big";
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

export function buildIgdbImageUrl(
  imageId: string,
  size: "cover_big" | "cover_small" | "screenshot_big" | "screenshot_huge" | `t_${string}` = "cover_big",
): string {
  const normalizedSize = size.startsWith("t_") ? size : `t_${size}`;
  return `https://images.igdb.com/igdb/image/upload/${normalizedSize}/${imageId}.jpg`;
}

export function resolveIgdbImage(asset?: { image_id?: string | null }, size?: Parameters<typeof buildIgdbImageUrl>[1]): string |
  null {
  if (!asset?.image_id) {
    return null;
  }
  if (size === "cover_big") {
    return getIgdbImageUrl(asset.image_id, "cover");
  }
  if (size === "screenshot_big") {
    return getIgdbImageUrl(asset.image_id, "screenshot");
  }
  return buildIgdbImageUrl(asset.image_id, size ?? "cover_big");
}

const getBaseUrl = (): string => {
  const raw = IGDB_BASE_URL?.trim();
  return raw && raw.length > 0 ? raw : "https://api.igdb.com/v4";
};

export class IgdbRequestError extends Error {
  constructor(message: string, public status?: number, public body?: string) {
    super(message);
    this.name = "IgdbRequestError";
  }
}

export async function igdbFetch<T>(endpoint: string, body: string): Promise<T> {
  const { accessToken, clientId } = await getIgdbToken();
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");

  const res = await fetch(`${baseUrl}/${normalizedEndpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body,
    next: { revalidate: 60 },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`IGDB error for ${normalizedEndpoint}`, res.status, text);
    throw new IgdbRequestError(
      `IGDB ${normalizedEndpoint} failed: ${res.status} ${text.substring(0, 300)}`,
      res.status,
      text,
    );
  }

  return (text ? JSON.parse(text) : []) as T;
}

export async function igdbRequest<T>(endpoint: string, query: string): Promise<T> {
  return igdbFetch<T>(endpoint, query);
}

const sanitizeSearchTerm = (term: string): string => term.replace(/"/g, '\\"');

export async function searchIgdbGameCoverByName(name: string): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  try {
    const sanitizedName = sanitizeSearchTerm(trimmed);
    const query = `search "${sanitizedName}";\nfields id,name,cover.image_id;\nlimit 1;`;

    const data = await igdbRequest<IgdbGame[]>("/games", query);
    const imageId = data?.[0]?.cover?.image_id;
    if (imageId) {
      return buildIgdbImageUrl(imageId, "cover_big");
    }
  } catch (error) {
    console.error("IGDB cover lookup error", error);
  }

  return null;
}

const parseCommaSeparatedIds = (value?: string): number[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .map((part) => Number.parseInt(part, 10))
    .filter((num) => Number.isFinite(num));
};

const parseCommaSeparatedSlugs = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
};

const keywordCache = new Map<string, number>();

async function fetchKeywordIds(slugs: string[]): Promise<number[]> {
  const unique = Array.from(new Set(slugs));
  const missing = unique.filter((slug) => !keywordCache.has(slug));

  if (missing.length) {
    const quoted = missing.map((slug) => `"${sanitizeSearchTerm(slug)}"`).join(",");
    const query = `where slug = (${quoted});\nfields id,slug;\nlimit ${missing.length};`;
    try {
      const data = await igdbRequest<Array<{ id: number; slug?: string }>>("keywords", query);
      data.forEach((entry) => {
        if (entry.slug && Number.isFinite(entry.id)) {
          keywordCache.set(entry.slug, entry.id);
        }
      });
    } catch (error) {
      console.error("IGDB keyword lookup failed", error);
    }
  }

  return unique
    .map((slug) => keywordCache.get(slug))
    .filter((id): id is number => typeof id === "number");
}

const parseDateRange = (range?: string): { from?: number; to?: number } => {
  if (!range) return {};
  const [rawFrom, rawTo] = range.split(",");
  const from = rawFrom?.trim() ? Date.parse(rawFrom.trim()) : NaN;
  const to = rawTo?.trim() ? Date.parse(rawTo.trim()) : NaN;
  return {
    from: Number.isFinite(from) ? Math.floor(from / 1000) : undefined,
    to: Number.isFinite(to) ? Math.floor(to / 1000) : undefined,
  };
};

const parseRatingRange = (range?: string): { min?: number; max?: number } => {
  if (!range) return {};
  const [rawMin, rawMax] = range.split(",");
  const min = rawMin ? Number.parseFloat(rawMin) : NaN;
  const max = rawMax ? Number.parseFloat(rawMax) : NaN;
  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
};

const ORDERING_FIELDS: Record<string, { field: string; direction: "asc" | "desc" }> = {
  "": { field: "popularity", direction: "desc" },
  "-added": { field: "popularity", direction: "desc" },
  "-rating": { field: "total_rating", direction: "desc" },
  "-metacritic": { field: "total_rating", direction: "desc" },
  "-released": { field: "first_release_date", direction: "desc" },
  name: { field: "name", direction: "asc" },
};

const buildSortClause = (ordering?: string): string => {
  const key = ordering ?? "";
  const rule = ORDERING_FIELDS[key] ?? ORDERING_FIELDS[""];
  return `sort ${rule.field} ${rule.direction};`;
};

const clampPageSize = (size?: number): number => {
  if (!size || !Number.isFinite(size)) return 24;
  return Math.min(Math.max(size, 1), 50);
};

export async function searchIgdbGames(params: IgdbSearchParams): Promise<IgdbSearchResponse> {
  const pageSize = clampPageSize(params.page_size);
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const offset = (page - 1) * pageSize;

  const searchTerm = params.search?.trim();
  const platformIds = parseCommaSeparatedIds(params.platforms);
  const genreIds = parseCommaSeparatedIds(params.genres);
  const keywordSlugs = parseCommaSeparatedSlugs(params.tags);
  const dateRange = parseDateRange(params.dates);
  const ratingRange = parseRatingRange(params.metacritic);

  const whereClauses: string[] = [];

  if (platformIds.length) {
    whereClauses.push(`platforms = (${platformIds.join(",")})`);
  }

  if (genreIds.length) {
    whereClauses.push(`genres = (${genreIds.join(",")})`);
  }

  if (keywordSlugs.length) {
    const keywordIds = await fetchKeywordIds(keywordSlugs);
    if (keywordIds.length) {
      whereClauses.push(`keywords = (${keywordIds.join(",")})`);
    }
  }

  if (typeof dateRange.from === "number") {
    whereClauses.push(`first_release_date >= ${dateRange.from}`);
  }
  if (typeof dateRange.to === "number") {
    whereClauses.push(`first_release_date <= ${dateRange.to}`);
  }

  if (typeof ratingRange.min === "number") {
    whereClauses.push(`total_rating >= ${ratingRange.min}`);
  }
  if (typeof ratingRange.max === "number") {
    whereClauses.push(`total_rating <= ${ratingRange.max}`);
  }

  const queryParts: string[] = [];
  queryParts.push(
    "fields id,name,slug,summary,first_release_date,total_rating,total_rating_count,rating,rating_count,cover.image_id,platforms.id,platforms.name,platforms.slug,platforms.abbreviation,genres.id,genres.name;",
  );

  if (searchTerm) {
    queryParts.push(`search "${sanitizeSearchTerm(searchTerm)}";`);
  }

  if (whereClauses.length) {
    queryParts.push(`where ${whereClauses.join(" & ")};`);
  }

  queryParts.push(buildSortClause(params.ordering));
  queryParts.push(`limit ${pageSize};`);
  queryParts.push(`offset ${offset};`);

  const results = await igdbRequest<IgdbGame[]>("games", queryParts.join("\n"));

  let total = results.length;
  try {
    const whereSegment = whereClauses.length ? `where ${whereClauses.join(" & ")};` : "";
    const payload = await igdbRequest<Array<{ count: number }>>("games/count", whereSegment);
    total = payload?.[0]?.count ?? total;
  } catch (error) {
    console.error("IGDB count lookup failed", error);
  }

  return {
    results,
    total,
    page,
    pageSize,
  };
}

export async function getIgdbGameDetails(id: number): Promise<IgdbGameDetails | null> {
  const query = `
    fields
      id,
      name,
      slug,
      summary,
      storyline,
      first_release_date,
      total_rating,
      total_rating_count,
      rating,
      rating_count,
      cover.image_id,
      platforms.id,
      platforms.name,
      platforms.abbreviation,
      genres.id,
      genres.name,
      themes.id,
      themes.name,
      keywords.id,
      keywords.name,
      game_modes.id,
      game_modes.name,
      player_perspectives.id,
      player_perspectives.name,
      involved_companies.company.name,
      involved_companies.developer,
      involved_companies.publisher,
      websites.url,
      websites.category,
      videos.name,
      videos.video_id,
      screenshots.image_id,
      screenshots.width,
      screenshots.height,
      artworks.image_id,
      artworks.width,
      artworks.height,
      similar_games.id,
      similar_games.name,
      similar_games.slug,
      similar_games.cover.image_id,
      similar_games.screenshots.image_id,
      similar_games.total_rating,
      similar_games.total_rating_count,
      similar_games.platforms.id,
      similar_games.platforms.name,
      dlcs.id,
      dlcs.name,
      dlcs.slug,
      dlcs.cover.image_id,
      dlcs.screenshots.image_id,
      expansions.id,
      expansions.name,
      expansions.slug,
      expansions.cover.image_id,
      expansions.screenshots.image_id,
      remakes.id,
      remakes.name,
      remakes.slug,
      remakes.cover.image_id,
      remakes.screenshots.image_id,
      remasters.id,
      remasters.name,
      remasters.slug,
      remasters.cover.image_id,
      remasters.screenshots.image_id,
      parent_game.id,
      parent_game.name,
      parent_game.slug,
      parent_game.cover.image_id,
      parent_game.screenshots.image_id;
    where id = ${id};
    limit 1;
  `;

  try {
    const data = await igdbRequest<IgdbGameDetails[]>("games", query);
    return data[0] ?? null;
  } catch (error) {
    if (error instanceof IgdbRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchIgdbAchievements(gameId: number, limit = 20): Promise<IgdbAchievement[]> {
  const safeLimit = Math.max(limit, 1);
  const query = `
    fields
      id,
      name,
      description,
      instructions,
      achievement_icon.image_id,
      locked_icon.image_id,
      unlocked_icon.image_id;
    where game = ${gameId};
    limit ${safeLimit};
  `;

  try {
    const data = await igdbRequest<IgdbAchievement[]>("achievements", query);
    return data ?? [];
  } catch (error) {
    if (error instanceof IgdbRequestError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function searchIgdbPlatforms(query: string): Promise<IgdbPlatformSummary[]> {
  const sanitized = sanitizeSearchTerm(query.trim());
  const clauses = ["fields id,name,slug,abbreviation,generation;", "limit 50;"];
  if (sanitized) {
    clauses.unshift(`search "${sanitized}";`);
  }

  const results = await igdbRequest<
    Array<{ id: number; name: string; slug?: string; abbreviation?: string | null; generation?: number | null }>
  >("/platforms", clauses.join("\n"));

  return results.map((platform) => ({
    id: platform.id,
    name: platform.name,
    slug: platform.slug,
    abbreviation: platform.abbreviation ?? null,
    generation: platform.generation ?? null,
  }));
}
