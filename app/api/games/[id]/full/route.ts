import { NextResponse } from "next/server";

import {
  getGameDetailsRawg,
  getGameMoviesRawg,
  getGameScreenshotsRawg,
  getSimilarGamesByGenresRawg,
  type RawgGameDetail,
  type RawgGameSummary,
  type RawgScreenshot,
} from "@/lib/rawg";
import { resolveTgdbBoxArt, searchGamesTgdb } from "@/lib/tgdb";
import { searchGameplayVideo } from "@/lib/youtube";
import type { VideoSource } from "@/lib/types";

export type FusedGameDetail = {
  rawg: RawgGameDetail;
  screenshots: RawgScreenshot[];
  video?: VideoSource;
  similar: RawgGameSummary[];
  boxart?: {
    source: "rawg" | "tgdb";
    url: string;
  };
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const idOrSlug = params.id;

  try {
    const rawg = await getGameDetailsRawg(idOrSlug);
    const [screenshots, movies, similar] = await Promise.all([
      getGameScreenshotsRawg(rawg.id),
      getGameMoviesRawg(rawg.id),
      getSimilarGamesByGenresRawg(rawg),
    ]);

    let video: VideoSource | undefined;
    const firstMovie = movies[0];
    if (firstMovie) {
      const url = firstMovie.data.max ?? firstMovie.data["480"] ?? null;
      if (url) {
        video = {
          type: "rawg",
          url,
          preview: firstMovie.preview ?? null,
          title: firstMovie.name,
        };
      }
    }

    if (!video) {
      try {
        const youtubeResults = await searchGameplayVideo(rawg.name, 1);
        const first = youtubeResults[0];
        const videoId = first?.id?.videoId;
        if (videoId) {
          video = {
            type: "youtube",
            url: `https://www.youtube.com/embed/${videoId}`,
            preview: first.snippet.thumbnails?.high?.url,
            title: first.snippet.title,
          };
        }
      } catch (youtubeError) {
        console.warn("YouTube fallback failed", youtubeError);
      }
    }

    const screenshotSet = new Map<string, RawgScreenshot>();
    rawg.short_screenshots?.forEach((shot) => {
      if (shot?.image) {
        screenshotSet.set(shot.image, { id: shot.id, image: shot.image });
      }
    });
    screenshots.forEach((shot) => {
      if (shot?.image && !screenshotSet.has(shot.image)) {
        screenshotSet.set(shot.image, shot);
      }
    });

    let boxart: FusedGameDetail["boxart"] | undefined;
    if (rawg.background_image) {
      boxart = { source: "rawg", url: rawg.background_image };
    } else {
      try {
        const tgdbResponse = await searchGamesTgdb(rawg.name);
        const baseUrl = tgdbResponse.data.base_url;
        const tgdbGame = tgdbResponse.data.games?.[0];
        const fallback = tgdbGame ? resolveTgdbBoxArt(tgdbGame, baseUrl) : null;
        if (fallback) {
          boxart = { source: "tgdb", url: fallback };
        }
      } catch (tgdbError) {
        console.warn("TGDB fallback failed", tgdbError);
      }
    }

    const fused: FusedGameDetail = {
      rawg,
      screenshots: Array.from(screenshotSet.values()),
      video,
      similar,
      boxart,
    };

    return NextResponse.json(fused);
  } catch (error) {
    console.error("Fusion detail error", error);
    const message = error instanceof Error ? error.message : "Unable to load game details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

