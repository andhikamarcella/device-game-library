import type { RawgGame } from "@/lib/rawg";

export interface GameFeatureFlags {
  controllerSupport?: "none" | "partial" | "full";
  crossplay?: boolean;
  fps?: 30 | 60 | 120 | null;
  hdr?: boolean;
  rayTracing?: boolean;
  dolbyAtmos?: boolean;
}

export function extractGameFeatures(game: Pick<RawgGame, "tags">): GameFeatureFlags {
  const tags = game.tags ?? [];
  const hasTag = (needle: string) =>
    tags.some((tag) => {
      const slug = tag.slug?.toLowerCase() ?? "";
      const name = tag.name?.toLowerCase() ?? "";
      return slug.includes(needle) || name.includes(needle);
    });

  const flags: GameFeatureFlags = { fps: null };

  if (hasTag("full-controller") || hasTag("full controller")) {
    flags.controllerSupport = "full";
  } else if (hasTag("controller") || hasTag("partial-controller") || hasTag("partial controller")) {
    flags.controllerSupport = "partial";
  }

  if (hasTag("crossplay") || hasTag("cross-platform") || hasTag("cross platform")) {
    flags.crossplay = true;
  }

  if (hasTag("120fps") || hasTag("120-fps") || hasTag("120 fps")) {
    flags.fps = 120;
  } else if (hasTag("60fps") || hasTag("60-fps") || hasTag("60 fps")) {
    flags.fps = 60;
  } else if (hasTag("30fps") || hasTag("30-fps") || hasTag("30 fps")) {
    flags.fps = 30;
  }

  if (hasTag("hdr")) {
    flags.hdr = true;
  }

  if (hasTag("ray-tracing") || hasTag("ray tracing")) {
    flags.rayTracing = true;
  }

  if (hasTag("dolby-atmos") || hasTag("dolby atmos") || hasTag("spatial-audio") || hasTag("3d-audio") || hasTag("atmos")) {
    flags.dolbyAtmos = true;
  }

  return flags;
}
