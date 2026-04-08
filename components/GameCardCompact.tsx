"use client";

import { Loader2, Star } from "lucide-react";
import { igdbCoverUrl } from "@/lib/igdbImages";
import { PlatformIcon } from "@/lib/platformIcons";
import { cn } from "@/lib/utils";

export type CompactPlatform = {
  id: number | string;
  name?: string;
  abbreviation?: string | null;
};

export interface CompactGameCardData {
  id: number | string;
  name: string;
  coverImageId?: string | null;
  coverUrl?: string | null;
  rating?: number | null;
  ratingsCount?: number | null;
  releaseYear?: number | null;
  platforms?: CompactPlatform[];
}

interface GameCardCompactProps {
  game: CompactGameCardData;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  footer?: React.ReactNode;
}

export function GameCardCompact({
  game,
  actionLabel,
  onAction,
  actionDisabled,
  actionBusy,
  footer,
}: GameCardCompactProps) {
  const releaseLabel = game.releaseYear ? `Released ${game.releaseYear}` : "Release TBA";
  const ratingLabel =
    typeof game.rating === "number" && !Number.isNaN(game.rating) ? game.rating.toFixed(1) : null;
  const coverUrl = igdbCoverUrl(game.coverImageId) ?? game.coverUrl ?? null;

  return (
    <article className="glass-panel group flex flex-col overflow-hidden rounded-2xl text-slate-900 transition-colors duration-200 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-50 dark:text-slate-100">
      <div className="relative mx-auto w-full max-w-[120px] overflow-hidden rounded-xl bg-slate-200 text-center dark:bg-slate-800 sm:max-w-[150px] md:max-w-[160px]">
        <div className="aspect-[3/4] w-full">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${game.name} cover art`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
              No cover
            </div>
          )}
        </div>
        {ratingLabel ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-1 text-[11px] font-semibold text-amber-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-slate-950/70 dark:text-amber-300">
            <Star className="h-3 w-3" aria-hidden="true" />
            <span>{ratingLabel}</span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">{game.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{releaseLabel}</p>
        </div>
        {game.platforms?.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {game.platforms.map((platform) => (
              <span
                key={`${game.id}-${platform.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <PlatformIcon platform={platform.name ?? String(platform.id)} className="h-3.5 w-3.5" />
                <span>{platform.abbreviation ?? platform.name ?? "Unknown"}</span>
              </span>
            ))}
          </div>
        ) : null}
        {footer}
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled || actionBusy}
            aria-busy={actionBusy}
            className={cn(
              "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition",
              actionDisabled || actionBusy
                ? "cursor-not-allowed border-cyan-500/30 bg-cyan-500/10 text-cyan-700 opacity-70 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200"
                : "border-cyan-500/40 bg-cyan-500/90 text-white hover:-translate-y-0.5 hover:border-cyan-400 dark:border-cyan-500/60 dark:bg-cyan-500/30 dark:text-cyan-100",
            )}
          >
            {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
