import { NextResponse } from "next/server";
import { fetchFromYoutube } from "@/lib/server/youtubeClient";

type YoutubeSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: Record<
      string,
      {
        url: string;
        width?: number;
        height?: number;
      }
    >;
  };
};

type YoutubeSearchResponse = {
  items: YoutubeSearchItem[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const platform = searchParams.get("platform")?.trim() ?? "";
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const maxResults = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 5) : 3;

  if (!query) {
    return NextResponse.json({ error: "Query parameter q is required." }, { status: 400 });
  }

  try {
    const searchTerm = platform ? `${query} ${platform} gameplay` : `${query} gameplay`;
    const data = await fetchFromYoutube<YoutubeSearchResponse>("/search", {
      part: "snippet",
      type: "video",
      maxResults,
      q: searchTerm,
      safeSearch: "moderate",
    });

    const results = data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnails: item.snippet.thumbnails,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("YouTube gameplay error", error);
    const message = error instanceof Error ? error.message : "Unable to search YouTube.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
