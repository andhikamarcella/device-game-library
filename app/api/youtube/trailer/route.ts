import { NextResponse } from "next/server";
import { searchYoutubeTrailerForGame } from "@/lib/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get("gameName")?.trim();
  const platform = searchParams.get("platform")?.trim() || undefined;
  const maxResultsParam = Number.parseInt(searchParams.get("maxResults") ?? "", 10);
  const maxResults = Number.isFinite(maxResultsParam) ? maxResultsParam : undefined;

  if (!gameName) {
    return NextResponse.json(
      { ok: false, reason: "error", message: "Parameter gameName is required" },
      { status: 400 },
    );
  }

  try {
    const result = await searchYoutubeTrailerForGame(gameName, platform, maxResults);
    const status = !result.ok && result.reason === "quota-exceeded" ? 429 : !result.ok && result.reason === "error" ? 500 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("YouTube trailer proxy error", error);
    return NextResponse.json(
      { ok: false, reason: "error", message: "Failed to search YouTube trailer" },
      { status: 500 },
    );
  }
}
