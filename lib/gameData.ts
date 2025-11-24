import {
  buildIgdbImageUrl,
  getIgdbGameDetails,
  getIgdbImageUrl,
  fetchIgdbAchievements,
  resolveIgdbImage,
  searchIgdbGames as searchIgdbGamesInternal,
  searchIgdbPlatforms as searchIgdbPlatformsInternal,
  type IgdbGame,
  type IgdbAchievement,
  type IgdbGameDetails,
  type IgdbImageAsset,
  type IgdbPlatformRef,
  type IgdbSearchParams,
  type IgdbSimilarGame,
  type IgdbAgeRating,
  type IgdbWebsite,
  type IgdbLanguageSupport,
  type IgdbVideo,
} from "@/lib/igdb";
import { igdbScreenshotUrl } from "@/lib/igdbImages";

export type GamePlatformRequirement = {
  minimum?: string;
  recommended?: string;
};

export type GamePlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  requirements?: GamePlatformRequirement;
};

export type GamePlatformSummary = {
  id: number;
  name: string;
  slug: string;
  year_start: number | null;
  image_background: string | null;
};

export type GameTrailer = IgdbVideo;

export type GameEsrbRating = {
  id: number;
  name: string;
  slug: string;
};

export type GameMetacriticPlatform = {
  metascore: number | null;
  url?: string | null;
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type GameStore = {
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

export type GameSummary = {
  id: number;
  slug?: string | null;
  rawgId?: number | null;
  rawgSlug?: string | null;
  name: string;
  cover?: { image_id?: string | null } | null;
  background_image: string | null;
  background_image_additional?: string | null;
  short_screenshots?: GameScreenshot[];
  artworks?: GameArtwork[] | null;
  clip?: GameClip | null;
  released: string | null;
  rating: number | null;
  ratings_count?: number | null;
  metacritic?: number | null;
  playtime?: number | null;
  genres?: Array<{ id: number; name: string }> | null;
  platforms?: GamePlatform[] | null;
  parent_platforms?: GameParentPlatform[] | null;
  tags?: GameTag[] | null;
  stores?: GameStore[] | null;
};

export type GameAddedByStatus = Partial<
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

export type GameRatingBreakdown = {
  id: number;
  title: string;
  count: number;
  percent: number;
};

export type GameTag = {
  id: number;
  name: string;
  slug?: string | null;
};

export type GameSeriesEntry = {
  id: number;
  name: string;
  slug?: string | null;
};

export type GameParentGame = GameSeriesEntry | null;

export type GameParentPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type GameReactionSummary = Record<string, number>;

export type GamePlaytimeDistribution = Record<string, number>;

export type GameRelatedGame = {
  id: number;
  slug?: string | null;
  name: string;
  background_image?: string | null;
  released?: string | null;
  rating?: number | null;
  ratings_count?: number | null;
  parent_platforms?: GameParentPlatform[] | null;
};

export type GameSimilarEntry = GameSummary;

export type GameAchievement = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  percent: number | null;
  platforms: Array<{ id: number; name: string | null }>;
};

export type GameClip = {
  clip?: string | null;
  clips?: Record<string, string | undefined> | null;
  preview?: string | null;
  video?: string | null;
};

export type GameDetailsPayload = GameSummary & {
  genres: { id: number; name: string }[];
  themes?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  player_perspectives?: { id: number; name: string }[];
  franchises?: { id: number; name: string; slug?: string | null }[];
  collections?: { id: number; name: string; slug?: string | null }[];
  engines?: { id: number; name: string; slug?: string | null }[];
  involved_companies?:
    | Array<{
        id: number;
        developer?: boolean;
        publisher?: boolean;
        company?: { id: number; name?: string | null; slug?: string | null } | null;
      }>
    | null;
  description?: string | null;
  description_raw?: string | null;
  website?: string | null;
  reddit_url?: string | null;
  reddit_name?: string | null;
  reddit_count?: number | null;
  twitch_count?: number | null;
  youtube_count?: number | null;
  websites?: Array<{ id: number; url: string; category?: number | null; trusted?: boolean | null }> | null;
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
  added_by_status?: GameAddedByStatus | null;
  ratings?: GameRatingBreakdown[] | null;
  parent_game?: GameParentGame;
  parent_platforms?: GameParentPlatform[] | null;
  series?: GameSeriesEntry[] | { results?: GameSeriesEntry[] | null } | null;
  clip?: GameClip | null;
  movies?: GameTrailer[] | null;
  esrb_rating?: GameEsrbRating | null;
  metacritic?: number | null;
  metacritic_platforms?: GameMetacriticPlatform[] | null;
  additions?: GameRelatedGame[] | null;
  dlcs?: GameRelatedGame[] | null;
  expansions?: GameRelatedGame[] | null;
  reactions?: GameReactionSummary | null;
  playtime_distribution?: GamePlaytimeDistribution | null;
  age_ratings?: IgdbAgeRating[] | null;
  language_supports?: GameLanguageSupport[] | null;
  time_to_beat?: { hastly?: number | null; normally?: number | null; completely?: number | null } | null;
};

export type GameScreenshot = {
  id: number;
  image_id?: string | null;
  image: string;
  width?: number;
  height?: number;
};

export type GameArtwork = {
  id: number;
  image_id: string;
  image: string;
  width?: number;
  height?: number;
};

export type GameLanguageSupport = {
  id: number;
  language: { id: number; name: string | null } | null;
  audio: boolean;
  subtitles: boolean;
  interface: boolean;
};

export type GameReview = {
  id: number;
  text?: string | null;
  rating?: number | string | null;
  created?: string | null;
  user?: {
    username?: string | null;
  } | null;
};

export interface GameSearchParams {
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

export type GameSearchResponse = {
  results: GameSummary[];
  count: number;
  next: string | null;
  previous: string | null;
};

export async function searchGames(params: GameSearchParams = {}): Promise<GameSearchResponse> {
  const response = await searchIgdbGamesInternal({
    search: params.search,
    ordering: params.ordering,
    platforms: params.platforms,
    genres: params.genres,
    tags: params.tags,
    dates: params.dates,
    metacritic: params.metacritic,
    page: params.page,
    page_size: params.page_size,
  } satisfies IgdbSearchParams);

  const results = response.results.map(mapIgdbGameToGameSummary);
  const hasNext = response.page * response.pageSize < response.total;
  const hasPrev = response.page > 1;

  return {
    results,
    count: response.total,
    next: hasNext ? "igdb://next" : null,
    previous: hasPrev ? "igdb://prev" : null,
  };
}

/**
 * Fetch detailed information for a single IGDB game.
 */
export async function getGameDetails(id: number): Promise<GameDetailsPayload> {
  const details = await loadIgdbDetails(id);
  return mapIgdbDetailsToGameDetails(details);
}

export async function getGameScreenshots(
  id: number,
  page = 1,
  pageSize = 12,
): Promise<GameScreenshot[]> {
  const details = await loadIgdbDetails(id);
  const shots = mapScreenshots(details.screenshots);
  const safeSize = Math.max(pageSize, 1);
  const offset = Math.max(page - 1, 0) * safeSize;
  return shots.slice(offset, offset + safeSize);
}

export async function getGameReviews(_id: number, _page = 1, _pageSize = 6): Promise<GameReview[]> {
  return [];
}

export async function getGameVideos(id: number): Promise<IgdbVideo[]> {
  const details = await loadIgdbDetails(id);
  const videos = (details.videos ?? []).filter((video) => Boolean(video?.video_id));
  return videos.map((video, index) => ({
    ...video!,
    id: typeof video?.id === "number" ? video.id : index + 1,
    name: video?.name?.trim() || `${details.name ?? "Trailer"} ${index + 1}`,
    video_id: video!.video_id.trim(),
  }));
}

function mapAchievements(entries: IgdbAchievement[]): GameAchievement[] {
  return entries.map((entry) => {
    const imageId =
      entry.unlocked_icon?.image_id || entry.locked_icon?.image_id || entry.achievement_icon?.image_id || null;
    const platforms = (entry.platforms ?? [])
      .map((platform) => {
        if (!platform || typeof platform.id !== "number") return null;
        return { id: platform.id, name: platform.name ?? null };
      })
      .filter((platform): platform is { id: number; name: string | null } => Boolean(platform));
    return {
      id: entry.id,
      name: entry.name || "Unknown achievement",
      description: entry.description || entry.instructions || null,
      image: imageId ? buildIgdbImageUrl(imageId, "cover_small") : null,
      percent: null,
      platforms,
    } satisfies GameAchievement;
  });
}

export async function getGameAchievements(id: number, pageSize = 10): Promise<GameAchievement[]> {
  const results = await fetchIgdbAchievements(id, pageSize);
  return mapAchievements(results);
}

export async function getGameAdditions(id: number, pageSize = 6): Promise<GameRelatedGame[]> {
  const details = await loadIgdbDetails(id);
  const additions = mapRelatedGames(details.dlcs).concat(mapRelatedGames(details.expansions));
  return additions.slice(0, Math.max(pageSize, 1));
}

export async function getGameSeriesEntries(id: number, pageSize = 10): Promise<GameRelatedGame[]> {
  const details = await loadIgdbDetails(id);
  const series = mapSeries(details);
  return series.slice(0, Math.max(pageSize, 1));
}

export async function getSimilarGamesForGame(id: number, limit = 10): Promise<GameSimilarEntry[]> {
  const details = await loadIgdbDetails(id);
  const similar = mapSimilar(details.similar_games).filter((game) => game.id !== id);
  return similar.slice(0, Math.max(limit, 1));
}

/**
 * Retrieve a list of IGDB platforms, optionally filtered by a search query.
 */
export async function searchPlatforms(query = "", _page = 1, pageSize = 40): Promise<GamePlatformSummary[]> {
  const platforms = await searchIgdbPlatformsInternal(query);
  return platforms.slice(0, Math.max(pageSize, 1)).map((platform) => ({
    id: platform.id,
    name: platform.name,
    slug: platform.slug ?? slugify(platform.name),
    year_start: platform.generation ?? null,
    image_background: null,
  }));
}

const igdbDetailCache = new Map<number, Promise<IgdbGameDetails>>();

async function loadIgdbDetails(id: number): Promise<IgdbGameDetails> {
  if (!Number.isFinite(id)) {
    throw new Error("A valid IGDB game id must be provided.");
  }

  let request = igdbDetailCache.get(id);
  if (!request) {
    request = (async () => {
      const details = await getIgdbGameDetails(id);
      if (!details) {
        throw new Error(`Game ${id} not found on IGDB.`);
      }
      return details;
    })();
    igdbDetailCache.set(id, request);
  }

  try {
    return await request;
  } catch (error) {
    igdbDetailCache.delete(id);
    throw error;
  }
}

const YOUTUBE_THUMB_HOST = "https://img.youtube.com/vi/";
const YOUTUBE_WATCH_HOST = "https://www.youtube.com/watch?v=";

const slugify = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const toIsoDate = (value?: number | null): string | null => {
  if (!value || !Number.isFinite(value)) {
    return null;
  }
  try {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0] ?? null;
  } catch {
    return null;
  }
};

const uniqueById = <T extends { id: number }>(items: T[]): T[] => {
  const seen = new Set<number>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
};

const buildYoutubeUrl = (videoId: string): string => `${YOUTUBE_WATCH_HOST}${videoId}`;
const buildYoutubeThumb = (videoId: string): string => `${YOUTUBE_THUMB_HOST}${videoId}/hqdefault.jpg`;

const mapPlatformRef = (platform?: IgdbPlatformRef | null): GamePlatform | null => {
  if (!platform || !Number.isFinite(platform.id)) {
    return null;
  }
  const label = platform.name ?? `Platform ${platform.id}`;
  return {
    platform: {
      id: platform.id,
      name: label,
      slug: platform.slug ?? platform.abbreviation?.toLowerCase() ?? slugify(label),
    },
  };
};

const uniquePlatforms = <T extends { platform: { id: number } }>(entries: T[]): T[] => {
  const seen = new Set<number>();
  const result: T[] = [];
  for (const entry of entries) {
    const id = entry.platform.id;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(entry);
  }
  return result;
};

const mapPlatforms = (platforms?: IgdbPlatformRef[] | null): GamePlatform[] => {
  if (!platforms?.length) {
    return [];
  }
  const mapped = platforms
    .map((platform) => mapPlatformRef(platform))
    .filter((platform): platform is GamePlatform => Boolean(platform));
  return uniquePlatforms(mapped);
};

const mapParentPlatforms = (platforms?: IgdbPlatformRef[] | null): GameParentPlatform[] => {
  if (!platforms?.length) {
    return [];
  }
  const mapped = platforms
    .map((platform) => {
      if (!platform || !Number.isFinite(platform.id)) {
        return null;
      }
      const label = platform.name ?? `Platform ${platform.id}`;
      return {
        platform: {
          id: platform.id,
          name: label,
          slug: platform.abbreviation?.toLowerCase() ?? slugify(label),
        },
      } satisfies GameParentPlatform;
    })
    .filter((platform): platform is GameParentPlatform => Boolean(platform));
  return uniquePlatforms(mapped);
};

const mapKeywords = (keywords?: IgdbGameDetails["keywords"]): GameTag[] => {
  if (!keywords?.length) {
    return [];
  }
  return uniqueById(
    keywords
      .filter((keyword) => keyword && typeof keyword.id === "number")
      .map((keyword) => ({
        id: keyword!.id,
        name: keyword!.name ?? slugify(keyword!.slug ?? `Keyword ${keyword!.id}`),
        slug: keyword!.slug ?? slugify(keyword!.name ?? `keyword-${keyword!.id}`),
      })),
  );
};

const mapGenres = (genres?: IgdbGameDetails["genres"]): Array<{ id: number; name: string }> => {
  if (!genres?.length) {
    return [];
  }
  return uniqueById(
    genres
      .filter((genre) => genre && typeof genre.id === "number" && genre.name)
      .map((genre) => ({ id: genre!.id, name: genre!.name ?? `Genre ${genre!.id}` })),
  );
};

const mapNamedEntities = (
  entries?: Array<{ id: number; name?: string | null; slug?: string | null }> | null,
): Array<{ id: number; name: string; slug?: string | null }> => {
  if (!entries?.length) return [];

  return uniqueById(
    entries
      .filter((entry) => entry && typeof entry.id === "number")
      .map((entry) => ({
        id: entry!.id,
        name: entry!.name ?? `Item ${entry!.id}`,
        slug: entry!.slug ?? slugify(entry!.name ?? ""),
      })),
  );
};

const mapModes = (entries?: IgdbGameDetails["game_modes"]): Array<{ id: number; name: string }> => {
  if (!entries?.length) return [];

  return uniqueById(
    entries
      .filter((entry) => entry && typeof entry.id === "number")
      .map((entry) => ({ id: entry!.id, name: entry!.name ?? `Mode ${entry!.id}` })),
  );
};

const mapInvolvedCompanies = (
  entries?: IgdbGameDetails["involved_companies"],
):
  | Array<{
      id: number;
      developer?: boolean;
      publisher?: boolean;
      company?: { id: number; name?: string | null; slug?: string | null } | null;
    }>
  | null => {
  if (!entries?.length) return [];

  return entries
    .filter((entry) => entry && typeof entry.id === "number")
    .map((entry) => ({
      id: entry!.id,
      developer: Boolean(entry!.developer),
      publisher: Boolean(entry!.publisher),
      company: entry!.company
        ? {
            id: entry!.company.id,
            name: entry!.company.name,
            slug: entry!.company.slug ?? slugify(entry!.company.name ?? undefined),
          }
        : null,
    }));
};

const mapScreenshots = (assets?: IgdbImageAsset[]): GameScreenshot[] => {
  if (!assets?.length) {
    return [];
  }
  const screenshots: GameScreenshot[] = [];
  assets.forEach((asset, index) => {
    if (!asset?.image_id) {
      return;
    }
    const image = igdbScreenshotUrl(asset.image_id);
    if (!image) {
      return;
    }
    screenshots.push({
      id: typeof asset.id === "number" ? asset.id : index,
      image_id: asset.image_id,
      image,
      width: asset.width,
      height: asset.height,
    });
  });
  return screenshots;
};

const mapArtworks = (assets?: IgdbImageAsset[]): GameArtwork[] => {
  if (!assets?.length) {
    return [];
  }

  const artworks: GameArtwork[] = [];
  assets.forEach((asset, index) => {
    if (!asset?.image_id) {
      return;
    }
    const image = igdbScreenshotUrl(asset.image_id);
    if (!image) {
      return;
    }
    artworks.push({
      id: typeof asset.id === "number" ? asset.id : index,
      image_id: asset.image_id,
      image,
      width: asset.width,
      height: asset.height,
    });
  });

  return artworks;
};

const mapWebsites = (websites?: IgdbWebsite[] | null) => {
  if (!websites?.length) return [] as Array<{ id: number; url: string; category?: number | null; trusted?: boolean | null }>;

  const mapped = websites
    .filter((entry): entry is IgdbWebsite => Boolean(entry && entry.url))
    .map((entry) => ({
      id: entry.id,
      url: entry.url,
      category: entry.category ?? null,
      trusted: typeof entry.trusted === "boolean" ? entry.trusted : null,
    }));

  const deduped: Array<{ id: number; url: string; category?: number | null; trusted?: boolean | null }> = [];
  const seen = new Set<string>();

  mapped.forEach((entry) => {
    const key = entry.url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(entry);
  });

  return deduped;
};

const mapSimilar = (similar?: IgdbSimilarGame[]): GameSimilarEntry[] => {
  if (!similar?.length) {
    return [];
  }
  return similar
    .filter((entry) => entry && Number.isFinite(entry.id))
    .map((entry) => ({
      ...mapIgdbGameToGameSummary(entry),
      slug: entry.slug ?? slugify(entry.name),
      parent_platforms: mapParentPlatforms(entry.platforms),
    }));
};

const mapRelatedGames = (list?: IgdbSimilarGame[] | null): GameRelatedGame[] => {
  if (!list?.length) {
    return [];
  }
  return list
    .filter((entry) => entry && Number.isFinite(entry.id))
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug ?? slugify(entry.name),
      name: entry.name,
      background_image:
        resolveIgdbImage(entry.cover) ?? mapScreenshots(entry.screenshots)[0]?.image ?? null,
      released: null,
      rating: typeof entry.total_rating === "number" ? entry.total_rating : null,
      ratings_count: entry.total_rating_count ?? null,
      parent_platforms: mapParentPlatforms(entry.platforms),
    }));
};

const mapSeries = (details: IgdbGameDetails): GameRelatedGame[] => {
  const parent = details.parent_game ? mapRelatedGames([details.parent_game])[0] : null;
  const remasters = mapRelatedGames(details.remasters);
  const remakes = mapRelatedGames(details.remakes);
  const ports = mapRelatedGames(details.expansions);
  return [parent, ...remasters, ...remakes, ...ports].filter(
    (entry): entry is GameRelatedGame => Boolean(entry),
  );
};

const relatedToSeriesEntry = (entry?: GameRelatedGame | null): GameSeriesEntry | null => {
  if (!entry) {
    return null;
  }
  return {
    id: entry.id,
    name: entry.name,
    slug: entry.slug ?? slugify(entry.name),
  };
};

const mapClip = (videos?: IgdbVideo[], gameName?: string): GameClip | null => {
  const source = videos?.find((video) => video?.video_id);
  if (!source?.video_id) {
    return null;
  }
  const url = buildYoutubeUrl(source.video_id);
  return {
    clip: url,
    video: url,
    preview: buildYoutubeThumb(source.video_id),
    clips: { full: url, featured: url },
  };
};

const mapAgeRatings = (entries?: IgdbAgeRating[] | null): IgdbAgeRating[] => {
  if (!entries?.length) return [];

  return entries
    .filter((entry): entry is IgdbAgeRating => Boolean(entry))
    .map((entry, index) => {
      const rating =
        typeof entry.rating === "number"
          ? entry.rating
          : typeof entry.rating === "string"
            ? Number.parseInt(entry.rating, 10)
            : null;

      const category = typeof entry.category === "number" ? entry.category : null;
      const rating_cover_url =
        typeof entry.rating_cover_url === "string" && entry.rating_cover_url.trim()
          ? entry.rating_cover_url.trim()
          : null;

      const idFallback = Number.isFinite(rating)
        ? Number(`${category ?? ""}${rating}`.replace(/\D+/g, "")) || index
        : index;

      return {
        id: typeof entry.id === "number" ? entry.id : idFallback,
        category,
        rating,
        synopsis: typeof entry.synopsis === "string" ? entry.synopsis.trim() : null,
        rating_cover_url,
      } satisfies IgdbAgeRating;
    })
    .filter((entry) => entry.category !== null || entry.rating !== null || entry.rating_cover_url);
};

const normalizeSupportType = (value?: number | number[] | null): number[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is number => typeof item === "number");
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return [value];
  }
  return [];
};

const mapLanguageSupports = (
  entries?: IgdbLanguageSupport[] | null,
): GameLanguageSupport[] => {
  if (!entries?.length) return [];

  const grouped = new Map<
    string,
    {
      id: number;
      language: { id: number; name: string | null } | null;
      audio: boolean;
      subtitles: boolean;
      interface: boolean;
    }
  >();

  entries.forEach((entry, index) => {
    if (!entry) return;

    const supportTypes = normalizeSupportType(entry.language_support_type);
    if (!supportTypes.length) return;

    const languageName = entry.language?.name?.trim() || null;
    const languageId = typeof entry.language?.id === "number" ? entry.language.id : null;
    const idFallback = languageId ?? index;
    const key = languageId !== null ? `lang-${languageId}` : `idx-${index}-${languageName ?? "unknown"}`;

    const existing = grouped.get(key) ?? {
      id: typeof entry.id === "number" ? entry.id : idFallback,
      language:
        languageName || languageId !== null
          ? {
              id: languageId ?? idFallback,
              name: languageName,
            }
          : null,
      audio: false,
      subtitles: false,
      interface: false,
    };

    supportTypes.forEach((type) => {
      if (type === 1) existing.audio = true;
      if (type === 2) existing.subtitles = true;
      if (type === 3) existing.interface = true;
    });

    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
};

const mapTimeToBeat = (
  ttb?: { hastly?: number | null; normally?: number | null; completely?: number | null } | null,
): { hastly?: number | null; normally?: number | null; completely?: number | null } | null => {
  if (!ttb) return null;
  const toMinutes = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

  const hastly = toMinutes(ttb.hastly);
  const normally = toMinutes(ttb.normally);
  const completely = toMinutes(ttb.completely);

  if (hastly === null && normally === null && completely === null) {
    return null;
  }

  return { hastly, normally, completely };
};

const mapCompanies = (
  details: IgdbGameDetails,
  role: "developer" | "publisher",
): Array<{ id: number; name: string }> => {
  const companies = details.involved_companies ?? [];
  return uniqueById(
    companies
      .filter((entry) => Boolean(entry?.company) && Boolean(entry?.[role]))
      .map((entry) => ({
        id: entry!.company!.id,
        name: entry!.company!.name ?? `Company ${entry!.company!.id}`,
      })),
  );
};

const mapIgdbGameToGameSummary = (game: IgdbGame): GameSummary => {
  const screenshots = mapScreenshots(game.screenshots);
  const artworks = "artworks" in game ? mapArtworks((game as IgdbGameDetails).artworks) : [];
  const cover = resolveIgdbImage(game.cover) ?? artworks[0]?.image ?? screenshots[0]?.image ?? null;
  const primaryBackdrop = artworks[0]?.image ?? screenshots[0]?.image ?? cover;
  const secondaryImage = screenshots[1]?.image ?? artworks[1]?.image ?? primaryBackdrop ?? cover;
  const slug = game.slug ?? slugify(game.name);
  const userRating = typeof game.rating === "number" ? game.rating : null;
  const critics = typeof game.total_rating === "number" ? game.total_rating : null;
  const aggregated = typeof game.aggregated_rating === "number" ? game.aggregated_rating : null;
  const ratingValue = userRating ?? critics ?? aggregated;
  const ratingCount =
    typeof game.rating_count === "number"
      ? game.rating_count
      : typeof game.total_rating_count === "number"
        ? game.total_rating_count
        : null;
  return {
    id: game.id,
    slug,
    rawgId: null,
    rawgSlug: slug,
    name: game.name,
    cover: game.cover ?? null,
    background_image: primaryBackdrop,
    background_image_additional: secondaryImage,
    short_screenshots: screenshots,
    clip: null,
    released: toIsoDate(game.first_release_date),
    rating: ratingValue,
    ratings_count: ratingCount,
    metacritic: null,
    playtime: null,
    genres: mapGenres(game.genres),
    platforms: mapPlatforms(game.platforms),
    parent_platforms: mapParentPlatforms(game.platforms),
    tags: [],
    stores: [],
  };
};

const mapIgdbDetailsToGameDetails = (details: IgdbGameDetails): GameDetailsPayload => {
  const base = mapIgdbGameToGameSummary(details);
  const screenshots = mapScreenshots(details.screenshots);
  const descriptionParts = [details.summary, details.storyline].filter((part): part is string => Boolean(part));
  const descriptionRaw = descriptionParts.join("\n\n");
  const seriesRelated = mapSeries(details);
  const parentSeriesEntry = relatedToSeriesEntry(seriesRelated[0]);
  const seriesEntries = seriesRelated.map((entry) => ({
    id: entry.id,
    name: entry.name,
    slug: entry.slug ?? slugify(entry.name),
  }));
  return {
    ...base,
    background_image_additional:
      base.background_image_additional ?? screenshots[0]?.image ?? base.background_image ?? null,
    short_screenshots: screenshots,
    artworks: mapArtworks(details.artworks),
    clip: mapClip(details.videos, details.name),
    movies: [],
    genres: mapGenres(details.genres),
    themes: mapNamedEntities(details.themes),
    description: descriptionRaw || null,
    description_raw: descriptionRaw || null,
    website: details.websites?.[0]?.url ?? null,
    websites: mapWebsites(details.websites),
    reddit_url: null,
    reddit_name: null,
    reddit_count: null,
    twitch_count: null,
    youtube_count: null,
    developers: mapCompanies(details, "developer"),
    publishers: mapCompanies(details, "publisher"),
    added_by_status: {},
    ratings: [],
    parent_game: parentSeriesEntry,
    series: seriesEntries,
    esrb_rating: null,
    metacritic: null,
    metacritic_platforms: [],
    additions: mapRelatedGames(details.dlcs),
    dlcs: mapRelatedGames(details.dlcs),
    expansions: mapRelatedGames(details.expansions),
    reactions: {},
    playtime_distribution: {},
    tags: mapKeywords(details.keywords),
    age_ratings: mapAgeRatings(details.age_ratings),
    language_supports: mapLanguageSupports(details.language_supports),
    time_to_beat: mapTimeToBeat(
      typeof details.time_to_beat === "object" && details.time_to_beat ? details.time_to_beat : null,
    ),
    game_modes: mapModes(details.game_modes),
    player_perspectives: mapModes(details.player_perspectives),
    franchises: mapNamedEntities(details.franchises),
    collections: mapNamedEntities(details.collections),
    engines: mapNamedEntities(details.game_engines),
    involved_companies: mapInvolvedCompanies(details.involved_companies),
  };
};
