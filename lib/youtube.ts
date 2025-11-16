import { fetchFromYoutube } from "@/lib/server/youtubeClient";

export type YoutubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnails: Record<string, { url: string }>;
};

export type PlatformVideoGroup = {
  slug: string;
  name: string;
  videos: YoutubeVideo[];
};

type YoutubeSearchResponse = {
  items: Array<{
    id?: { videoId?: string | null } | null;
    snippet?: {
      title?: string | null;
      channelTitle?: string | null;
      thumbnails?: Record<string, { url: string }>;
    } | null;
  }>;
};

export async function getGameplayVideos(
  query: string,
  options: { platform?: string | null; maxResults?: number } = {},
): Promise<YoutubeVideo[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const { platform, maxResults = 3 } = options;
  const clampedResults = Math.min(Math.max(Math.trunc(maxResults) || 1, 1), 5);
  const searchTerm = platform ? `${trimmed} ${platform} gameplay` : `${trimmed} gameplay`;

  const data = await fetchFromYoutube<YoutubeSearchResponse>("/search", {
    part: "snippet",
    type: "video",
    maxResults: clampedResults,
    q: searchTerm,
  });

  return (data.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId ?? null;
      const title = item.snippet?.title ?? null;
      if (!videoId || !title) {
        return null;
      }
      return {
        videoId,
        title,
        channelTitle: item.snippet?.channelTitle ?? "",
        thumbnails: item.snippet?.thumbnails ?? {},
      } satisfies YoutubeVideo;
    })
    .filter((item): item is YoutubeVideo => Boolean(item));
}

export async function getGameplayVideosByPlatform(
  query: string,
  platforms: Array<{ slug: string; name: string }>,
  options: { maxPlatforms?: number; maxResultsPerPlatform?: number } = {},
): Promise<PlatformVideoGroup[]> {
  const trimmed = query.trim();
  if (!trimmed || !platforms.length) {
    return [];
  }

  const maxPlatforms = Math.min(Math.max(options.maxPlatforms ?? 6, 1), 10);
  const maxResults = options.maxResultsPerPlatform ?? 2;
  const uniquePlatforms: PlatformVideoGroup["slug"][] = [];
  const filteredPlatforms = platforms
    .map((platform) => ({
      slug: platform.slug || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: platform.name.trim(),
    }))
    .filter((platform) => {
      if (!platform.name) {
        return false;
      }
      if (uniquePlatforms.includes(platform.slug)) {
        return false;
      }
      uniquePlatforms.push(platform.slug);
      return true;
    })
    .slice(0, maxPlatforms);

  const results = await Promise.all(
    filteredPlatforms.map(async (platform) => {
      const videos = await getGameplayVideos(trimmed, { platform: platform.name, maxResults });
      return { ...platform, videos } satisfies PlatformVideoGroup;
    }),
  );

  return results.filter((group) => group.videos.length > 0);
}
