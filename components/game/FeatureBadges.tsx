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
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-100">
          <ControllerIcon className="h-3.5 w-3.5" />
          <span>{flags.controllerSupport === "full" ? "Full Controller Support" : "Partial Controller Support"}</span>
        </div>
      ) : null}
      {flags.crossplay ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
          <CrossplayIcon className="h-3.5 w-3.5" />
          <span>Crossplay</span>
        </div>
      ) : null}
      {flags.fps ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-100">
          <FpsIcon className="h-3.5 w-3.5" />
          <span>{flags.fps} FPS</span>
        </div>
      ) : null}
      {flags.hdr ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-100">
          <HdrIcon className="h-3.5 w-3.5" />
          <span>HDR</span>
        </div>
      ) : null}
      {flags.rayTracing ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-100">
          <RayTracingIcon className="h-3.5 w-3.5" />
          <span>Ray Tracing</span>
        </div>
      ) : null}
      {flags.dolbyAtmos ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-100">
          <AtmosIcon className="h-3.5 w-3.5" />
          <span>Dolby Atmos / 3D Audio</span>
        </div>
      ) : null}
    </section>
  );
}
