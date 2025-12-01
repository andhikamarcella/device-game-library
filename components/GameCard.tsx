"use client";

import Link from "next/link";
import { ExternalLink, Sparkles, Star } from "lucide-react";
import { GameStatusControls } from "@/components/GameStatusControls";
import { type UserGame } from "@/hooks/LibraryProvider";
import { extractGameFeatures } from "@/lib/gameFeatures";
import type { GameSummary } from "@/lib/gameData";
import { normalizeImageUrl } from "@/lib/images";
import { PlatformIcon } from "@/lib/platformIcons";

export interface SearchPlatform {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string | null;
}

export interface SearchGameResult {
  id: number;
  slug: string | null;
  name: string;
  summary: string;
  cover?: { image_id?: string | null } | null;
  coverUrl: string | null;
  coverImageUrl?: string | null;
  screenshots: string[];
  screenshotUrls?: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: SearchPlatform[];
  genres: string[];
  popularity: number | null;
}

interface GameCardProps {
  game: SearchGameResult;
  coverOverride?: string | null;
  userGame?: UserGame;
  onAdd?: (game: SearchGameResult) => void;
  onUpdate?: (igdbId: number, patch: Partial<UserGame>) => void;
  onRemove?: (igdbId: number) => void;
  onShowSimilar?: (game: SearchGameResult) => void;
  detailReturnTo?: string;
}

const buildFeatureSource = (genres: string[]): Pick<GameSummary, "tags"> => {
  const pseudoTags = genres.map((genre, index) => ({
    id: index,
    name: genre,
    slug: genre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  }));
  return { tags: pseudoTags };
};

export function GameCard({
  game,
  coverOverride,
  userGame,
  onAdd,
  onUpdate,
  onRemove,
  onShowSimilar,
  detailReturnTo,
}: GameCardProps) {
  const fallbackScreenshot =
    (Array.isArray(game.screenshots) && game.screenshots.length
      ? game.screenshots[0]
      : game.screenshotUrls?.[0]) ?? null;
  const preferredCover = coverOverride ?? game.coverUrl ?? game.coverImageUrl ?? fallbackScreenshot;
  const normalizedCover = preferredCover ? normalizeImageUrl(preferredCover) : null;
  const coverSrc = normalizedCover ?? "/fallback/cover-placeholder.svg";
  const releaseYear = game.releaseYear ?? null;
  const ratingLabel = typeof game.rating === "number" && game.rating > 0 ? game.rating.toFixed(1) : "—";
  const detailHref = detailReturnTo
    ? `/games/${game.id}?returnTo=${encodeURIComponent(detailReturnTo)}`
    : `/games/${game.id}`;
  const platformChips = Array.isArray(game.platforms) ? game.platforms.slice(0, 4) : [];
  const screenshotSource = Array.isArray(game.screenshots) && game.screenshots.length
    ? game.screenshots
    : Array.isArray(game.screenshotUrls)
      ? game.screenshotUrls
      : [];
  const screenshotPreviews = screenshotSource.slice(0, 4);
  const featureFlags = extractGameFeatures(buildFeatureSource(game.genres ?? []));
  const featureBadges: Array<{ label: string }> = [];

  if (featureFlags.controllerSupport) {
    featureBadges.push({
      label:
        featureFlags.controllerSupport === "full"
          ? "Full controller support"
          : "Partial controller support",
    });
  }

  if (featureFlags.fps && featureBadges.length < 2) {
    featureBadges.push({ label: `${featureFlags.fps} FPS` });
  }

  if (featureFlags.crossplay && featureBadges.length < 2) {
    featureBadges.push({ label: "Crossplay" });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-md shadow-slate-900/10 transition-colors duration-300 hover:border-emerald-400/70 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
      <Link
        href={detailHref}
        className="relative block w-full overflow-hidden bg-slate-200 focus:outline-none dark:bg-slate-800"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[2/3] lg:aspect-[5/8]">
          <img
            src={coverSrc}
            alt={`${game.name} cover art`}
            width={600}
            height={900}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
          <div className="absolute left-4 bottom-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
            {releaseYear ? <span className="rounded-full bg-white/20 px-3 py-1">{releaseYear}</span> : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1">
              <Star className="h-3 w-3 fill-current" /> {ratingLabel}
            </span>
            {game.ratingsCount > 0 ? (
              <span className="rounded-full bg-slate-900/60 px-3 py-1 text-[11px]">
                {game.ratingsCount.toLocaleString()} ratings
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{game.name}</p>
              {game.summary ? (
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{game.summary}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onShowSimilar ? (
                <button
                  type="button"
                  onClick={() => onShowSimilar(game)}
                  className="inline-flex items-center gap-1 rounded-full border border-transparent bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-300"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Similar games
                </button>
              ) : null}
              <Link
                href={`/library/${game.id}`}
                className="inline-flex items-center gap-1 rounded-full border border-transparent bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                Library view <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={detailHref}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-400/70 hover:text-emerald-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
              >
                IGDB detail <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {platformChips.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
              {platformChips.map((platform) => (
                <span
                  key={platform.id}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100"
                >
                  <PlatformIcon platform={platform.name} className="h-3.5 w-3.5" />
                  <span>{platform.abbreviation ?? platform.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Platform details unavailable</p>
          )}
          {screenshotPreviews.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {screenshotPreviews.map((url, index) => (
                <img
                  key={`${game.id}-preview-${index}`}
                  src={url}
                  alt={`${game.name} screenshot ${index + 1}`}
                  width={160}
                  height={90}
                  className="h-24 w-40 flex-shrink-0 rounded-xl object-cover"
                />
              ))}
            </div>
          ) : null}
          {featureBadges.length ? (
            <div className="flex flex-wrap gap-2">
              {featureBadges.map((badge, index) => (
                <span
                  key={`${badge.label}-${index}`}
                  className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {userGame && onUpdate ? (
          <GameStatusControls userGame={userGame} onUpdate={onUpdate} onRemove={onRemove} />
        ) : (
          <button
            type="button"
            onClick={() => onAdd?.(game)}
            className="mt-auto inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Add to library
          </button>
        )}
      </div>
    </article>
  );
}
