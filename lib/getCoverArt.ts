import type { RawgGame } from "@/lib/rawg";
import { pickBestRawgImage } from "@/lib/images";

type CoverArtSource = Pick<RawgGame, "background_image" | "background_image_additional" | "short_screenshots" | "clip">;

const FALLBACK_COVER = "/fallback/cover-placeholder.svg";

export function getBestCover(game: CoverArtSource): string {
  const screenshotSources = game.short_screenshots?.map((shot) => shot.image) ?? [];
  const clipPreview = game.clip?.preview ?? null;
  const best =
    pickBestRawgImage([
      game.background_image_additional,
      game.background_image,
      ...screenshotSources,
      clipPreview,
    ]) ?? FALLBACK_COVER;

  return best;
}
