import type { GameSummary } from "@/lib/gameData";
import { pickBestImage } from "@/lib/images";

type CoverArtSource = Pick<GameSummary, "background_image" | "background_image_additional" | "short_screenshots" | "clip">;

const FALLBACK_COVER = "/fallback/cover-placeholder.svg";

export function getBestCover(game: CoverArtSource): string {
  const screenshotSources = game.short_screenshots?.map((shot) => shot.image) ?? [];
  const clipPreview = game.clip?.preview ?? null;

  const prioritizedSources: Array<string | null | undefined> = [game.background_image];

  if (!game.background_image) {
    prioritizedSources.push(game.background_image_additional);
  }

  prioritizedSources.push(...screenshotSources, clipPreview);

  const best = pickBestImage(prioritizedSources) ?? FALLBACK_COVER;

  return best;
}
