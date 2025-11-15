import { fetchFromYoutube } from "@/lib/server/youtubeClient";

export type YoutubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnails: Record<string, { url: string }>;
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

export async function getGameplayVideos(query: string, maxResults = 3): Promise<YoutubeVideo[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const data = await fetchFromYoutube<YoutubeSearchResponse>("/search", {
    part: "snippet",
    type: "video",
    maxResults,
    q: `${trimmed} gameplay`,
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
