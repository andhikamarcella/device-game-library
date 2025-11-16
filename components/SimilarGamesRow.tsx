"use client";

import Image from "next/image";
import Link from "next/link";
import { getPlatformIcon } from "@/lib/platformIcons";
import { normalizeRawgImageUrl } from "@/lib/images";

export interface SimilarGame {
  id: number;
  name: string;
  slug?: string | null;
  background_image: string | null;
  rating: number | null;
  released: string | null;
  parent_platforms?: Array<{ id: number; name: string; slug: string }>;
}

interface SimilarGamesRowProps {
  games: SimilarGame[];
}

export function SimilarGamesRow({ games }: SimilarGamesRowProps) {
  if (!games.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Similar games</h2>
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">RAWG suggestions</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const cover = normalizeRawgImageUrl(game.background_image);
          const releaseYear = game.released ? new Date(game.released).getFullYear() : null;
          const ratingLabel = typeof game.rating === "number" && game.rating > 0 ? game.rating.toFixed(1) : null;
          const platforms = (game.parent_platforms ?? []).slice(0, 3);

          return (
            <Link
              key={game.id}
              href={`/library/${game.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="relative h-40 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                {cover ? (
                  <Image
                    src={cover}
                    alt={`${game.name} artwork`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    No cover available
                  </div>
                )}
                {ratingLabel ? (
                  <div className="absolute top-3 right-3 inline-flex items-center rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white shadow">
                    RAWG {ratingLabel}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-base font-semibold text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
                  {game.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {releaseYear ? <span>{releaseYear}</span> : null}
                  {releaseYear && ratingLabel ? <span>•</span> : null}
                  {ratingLabel ? <span>{ratingLabel} avg</span> : null}
                </div>
                {platforms.length ? (
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
                    {platforms.map((platform) => {
                      const Icon = getPlatformIcon(platform.slug);
                      return (
                        <div
                          key={platform.id}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100"
                        >
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                          <span>{platform.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
