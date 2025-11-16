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

  if (!query) {
    return NextResponse.json({ error: "Query parameter q is required." }, { status: 400 });
  }

  try {
    const data = await fetchFromYoutube<YoutubeSearchResponse>("/search", {
      part: "snippet",
      type: "video",
      maxResults: 3,
      q: `${query} gameplay`,
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
