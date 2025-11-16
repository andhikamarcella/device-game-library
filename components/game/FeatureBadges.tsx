import { extractGameFeatures } from "@/lib/gameFeatures";
import type { RawgGame } from "@/lib/rawg";
import {
  AtmosIcon,
  ControllerIcon,
  CrossplayIcon,
  FpsIcon,
  HdrIcon,
  RayTracingIcon,
} from "@/components/icons/features";

const neutralChipClass =
  "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/80 px-2.5 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-none";

const highlightChipClass =
  "inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 shadow-sm dark:border-emerald-600/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:shadow-none";

interface FeatureBadgesProps {
  game: RawgGame;
}

export function FeatureBadges({ game }: FeatureBadgesProps) {
  const flags = extractGameFeatures(game);

  if (
    !flags.controllerSupport &&
    !flags.crossplay &&
    !flags.fps &&
    !flags.hdr &&
    !flags.rayTracing &&
    !flags.dolbyAtmos
  ) {
    return null;
  }

  return (
    <section className="mt-4 flex flex-wrap gap-2">
      {flags.controllerSupport ? (
        <div className={neutralChipClass}>
          <ControllerIcon className="h-3.5 w-3.5" />
          <span>{flags.controllerSupport === "full" ? "Full Controller Support" : "Partial Controller Support"}</span>
        </div>
      ) : null}
      {flags.crossplay ? (
        <div className={highlightChipClass}>
          <CrossplayIcon className="h-3.5 w-3.5" />
          <span>Crossplay</span>
        </div>
      ) : null}
      {flags.fps ? (
        <div className={neutralChipClass}>
          <FpsIcon className="h-3.5 w-3.5" />
          <span>{flags.fps} FPS</span>
        </div>
      ) : null}
      {flags.hdr ? (
        <div className={neutralChipClass}>
          <HdrIcon className="h-3.5 w-3.5" />
          <span>HDR</span>
        </div>
      ) : null}
      {flags.rayTracing ? (
        <div className={neutralChipClass}>
          <RayTracingIcon className="h-3.5 w-3.5" />
          <span>Ray Tracing</span>
        </div>
      ) : null}
      {flags.dolbyAtmos ? (
        <div className={neutralChipClass}>
          <AtmosIcon className="h-3.5 w-3.5" />
          <span>Dolby Atmos / 3D Audio</span>
        </div>
      ) : null}
    </section>
  );
}
