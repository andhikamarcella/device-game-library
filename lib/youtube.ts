import { fetchFromYoutube, YoutubeApiError } from "@/lib/server/youtubeClient";

export type YoutubeVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
};

export type YoutubeSearchResult =
  | { ok: true; videos: YoutubeVideo[] }
  | { ok: false; reason: "quota-exceeded" | "no-results" | "error"; message?: string };

type YoutubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string | null } | null;
    snippet?: {
      title?: string | null;
      channelTitle?: string | null;
      publishedAt?: string | null;
      thumbnails?: Record<string, { url: string }> | null;
    } | null;
  }>;
};

type CachedYoutubeEntry = {
  result: YoutubeSearchResult;
  expiresAt: number;
};

const youtubeCache = new Map<string, CachedYoutubeEntry>();
const SUCCESS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
const QUOTA_TTL = 1000 * 60 * 60 * 12; // 12 hours
const ERROR_TTL = 1000 * 60 * 15; // 15 minutes

function getCacheKey(query: string, maxResults: number): string {
  return `${query.toLowerCase()}::${maxResults}`;
}

function readCache(key: string): YoutubeSearchResult | null {
  const cached = youtubeCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt < Date.now()) {
    youtubeCache.delete(key);
    return null;
  }
  return cached.result;
}

function writeCache(key: string, result: YoutubeSearchResult, ttl: number): void {
  youtubeCache.set(key, { result, expiresAt: Date.now() + ttl });
}

function mapYoutubeItems(items: YoutubeSearchResponse["items"] | undefined, maxResults: number): YoutubeVideo[] {
  return (items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId ?? null;
      const snippet = item.snippet;
      if (!videoId || !snippet?.title) {
        return null;
      }
      const thumbnailUrl =
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: videoId,
        title: snippet.title,
        thumbnailUrl,
        channelTitle: snippet.channelTitle ?? "YouTube",
        publishedAt: snippet.publishedAt ?? "",
      } satisfies YoutubeVideo;
    })
    .filter((video): video is YoutubeVideo => Boolean(video))
    .slice(0, maxResults);
}

function handleError(error: unknown): { result: YoutubeSearchResult; ttl: number } {
  console.error("YouTube search error", error);
  const defaultResult: YoutubeSearchResult = { ok: false, reason: "error", message: "Failed to fetch YouTube data" };
  if (error instanceof YoutubeApiError) {
    if (error.status === 403 || /quota/i.test(error.message) || /daily/i.test(error.message)) {
      return {
        result: { ok: false, reason: "quota-exceeded", message: "YouTube quota exceeded" },
        ttl: QUOTA_TTL,
      };
    }
    return { result: { ...defaultResult, message: error.message }, ttl: ERROR_TTL };
  }
  return { result: defaultResult, ttl: ERROR_TTL };
}

export async function searchYoutubeTrailerForGame(
  gameName: string,
  platformHint?: string,
  maxResults = 1,
): Promise<YoutubeSearchResult> {
  const trimmedName = gameName.trim();
  if (!trimmedName) {
    return { ok: false, reason: "error", message: "A game name is required" };
  }

  const normalizedResults = Math.min(Math.max(Math.trunc(maxResults) || 1, 1), 3);
  const query = platformHint ? `${trimmedName} trailer ${platformHint}` : `${trimmedName} game trailer`;
  const cacheKey = getCacheKey(query, normalizedResults);
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchFromYoutube<YoutubeSearchResponse>("/search", {
      part: "snippet",
      type: "video",
      maxResults: normalizedResults,
      q: query,
      safeSearch: "moderate",
      videoCategoryId: "20",
    });

    const videos = mapYoutubeItems(data.items, normalizedResults);
    if (!videos.length) {
      const result: YoutubeSearchResult = { ok: false, reason: "no-results" };
      writeCache(cacheKey, result, SUCCESS_TTL);
      return result;
    }

    const result: YoutubeSearchResult = { ok: true, videos };
    writeCache(cacheKey, result, SUCCESS_TTL);
    return result;
  } catch (error) {
    const { result, ttl } = handleError(error);
    writeCache(cacheKey, result, ttl);
    return result;
  }
}
