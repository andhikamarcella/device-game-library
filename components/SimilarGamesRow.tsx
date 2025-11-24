"use client";

import Link from "next/link";
import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import { getBestCover } from "@/lib/getCoverArt";
import { normalizeImageUrl } from "@/lib/images";

export interface SimilarGame {
  id: number;
  name: string;
  slug?: string | null;
  background_image: string | null;
  background_image_additional?: string | null;
  cover?: { image_id?: string | null } | null;
  rating: number | null;
  released: string | null;
  short_screenshots?: Array<{ image: string | null }>;
  parent_platforms?: Array<{ id: number; name: string; slug: string }>;
}

interface SimilarGamesRowProps {
  games: SimilarGame[];
}

export function SimilarGamesRow({ games }: SimilarGamesRowProps) {
  if (!games.length) {
    return null;
  }

  const toCompactGame = (game: SimilarGame): CompactGameCardData => {
    const releaseYear = game.released ? new Date(game.released).getFullYear() : null;
    const platforms = (game.parent_platforms ?? []).slice(0, 4).map((platform) => ({
      id: platform.id,
      name: platform.name,
      abbreviation: platform.slug,
    }));

    const bestCover = getBestCover({
      background_image: game.background_image,
      background_image_additional: game.background_image_additional ?? null,
      short_screenshots: game.short_screenshots,
      artworks: [],
      clip: null,
      cover: game.cover,
    });

    return {
      id: game.id,
      name: game.name,
      coverImageId: game.cover?.image_id ?? null,
      coverUrl: normalizeImageUrl(bestCover) ?? null,
      rating: typeof game.rating === "number" ? game.rating : null,
      releaseYear,
      platforms,
    };
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Similar games</h2>
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">IGDB suggestions</span>
      </div>
      <div className="grid grid-flow-col auto-cols-[75%] gap-3 overflow-x-auto pb-2 sm:auto-cols-[55%] md:auto-cols-[45%] lg:auto-cols-[32%] xl:auto-cols-[26%]">
        {games.map((game) => {
          const card = toCompactGame(game);

          return (
            <Link key={game.id} href={`/library/${game.id}`} className="block focus:outline-none">
              <GameCardCompact game={card} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
