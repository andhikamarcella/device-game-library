"use client";

import Image from "next/image";
import Link from "next/link";

interface SimilarGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number | null;
  released: string | null;
}

interface SimilarGamesRowProps {
  games: SimilarGame[];
}

export function SimilarGamesRow({ games }: SimilarGamesRowProps) {
  if (!games.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Similar games</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="group relative flex h-48 w-40 shrink-0 flex-col justify-end overflow-hidden rounded-xl border border-slate-200 bg-slate-900/80 p-3 text-white shadow-sm transition hover:border-emerald-400 hover:shadow-lg dark:border-slate-800"
          >
            {game.background_image ? (
              <Image
                src={game.background_image}
                alt={game.name}
                fill
                className="-z-10 object-cover transition duration-500 group-hover:scale-105"
                sizes="160px"
              />
            ) : null}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-tight">{game.name}</p>
              {game.released ? (
                <p className="text-xs text-slate-300">{new Date(game.released).getFullYear()}</p>
              ) : null}
              {typeof game.rating === "number" ? (
                <p className="text-xs text-emerald-300">RAWG {game.rating.toFixed(1)}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
