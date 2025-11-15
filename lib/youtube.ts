const YT_BASE = process.env.YOUTUBE_SEARCH_BASE_URL ?? "https://www.googleapis.com/youtube/v3/search";
const YT_KEY = process.env.YOUTUBE_API_KEY;

if (!YT_KEY) {
  console.warn("YOUTUBE_API_KEY is not configured, YouTube fallback will be disabled");
}

export type YoutubeSearchItem = {
  id: { videoId?: string };
  snippet: {
    title: string;
    description: string;
    thumbnails?: { high?: { url: string } };
    channelTitle?: string;
  };
};

export async function searchGameplayVideo(query: string, maxResults = 3): Promise<YoutubeSearchItem[]> {
  if (!YT_KEY) {
    throw new Error("YouTube API not configured");
  }
  const url = new URL(YT_BASE);
  url.searchParams.set("key", YT_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("type", "video");
  url.searchParams.set("q", `${query} gameplay`);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return (data.items ?? []) as YoutubeSearchItem[];
}

