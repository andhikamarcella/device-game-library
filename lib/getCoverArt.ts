import type { GameSummary } from "@/lib/gameData";
import { igdbCoverUrl, igdbScreenshotUrl } from "@/lib/igdbImages";
import { pickBestImage } from "@/lib/images";

type CoverArtSource = Pick<
  GameSummary,
  | "background_image"
  | "background_image_additional"
  | "short_screenshots"
  | "artworks"
  | "clip"
  | "cover"
>;

const FALLBACK_COVER = "/fallback/cover-placeholder.svg";

export function getBestCover(game: CoverArtSource): string {
  const coverFromIgdb = igdbCoverUrl(game.cover?.image_id ?? null);
  const screenshotSources = game.short_screenshots?.map((shot) => shot.image) ?? [];
  const clipPreview = game.clip?.preview ?? null;
  const artworkSources =
    game.artworks?.map((art) => {
      if (art?.image_id) {
        return igdbScreenshotUrl(art.image_id);
      }
      return art?.image ?? null;
    }) ?? [];

  const prioritizedSources: Array<string | null | undefined> = [coverFromIgdb ?? game.background_image];

  if (!game.background_image) {
    prioritizedSources.push(game.background_image_additional);
  }

  prioritizedSources.push(...artworkSources, ...screenshotSources, clipPreview);

  const best = pickBestImage(prioritizedSources) ?? FALLBACK_COVER;

  return best;
}
