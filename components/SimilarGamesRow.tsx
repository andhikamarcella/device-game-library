"use client";

import Image from "next/image";
import Link from "next/link";
import PlatformChips from "@/components/PlatformChips";
import { normalizeImageUrl } from "@/lib/images";

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
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">IGDB suggestions</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const cover = normalizeImageUrl(game.background_image);
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
                    IGDB {ratingLabel}
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
                <PlatformChips platforms={platforms} size="sm" className="mt-auto" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
