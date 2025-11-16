"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LibraryBig, Sparkles } from "lucide-react";
import { GameStatusControls } from "@/components/GameStatusControls";
import { type UserGame } from "@/hooks/LibraryProvider";
import { normalizeRawgImageUrl } from "@/lib/images";

export interface SearchGameResult {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  rating: number | null;
  genres: Array<{ id: number; name: string }>;
  platforms: Array<{ id: number; name: string; slug: string }>;
  playtime: number;
  released: string | null;
}

interface GameCardProps {
  game: SearchGameResult;
  userGame?: UserGame;
  onAdd?: (game: SearchGameResult) => void;
  onUpdate?: (rawgId: number, patch: Partial<UserGame>) => void;
  onRemove?: (rawgId: number) => void;
  onShowSimilar?: (game: SearchGameResult) => void;
}

export function GameCard({ game, userGame, onAdd, onUpdate, onRemove, onShowSimilar }: GameCardProps) {
  const releaseYear = game.released ? new Date(game.released).getFullYear() : null;
  const coverImage = normalizeRawgImageUrl(game.background_image);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur transition hover:border-emerald-400/80 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
      <div className="relative h-48 w-full overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={game.name}
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <LibraryBig className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
          {releaseYear ? <span className="rounded-full bg-white/20 px-3 py-1">{releaseYear}</span> : null}
          {game.rating ? <span className="rounded-full bg-emerald-500/90 px-3 py-1">RAWG {game.rating.toFixed(1)}</span> : null}
          {game.playtime ? (
            <span className="rounded-full bg-slate-900/70 px-3 py-1">Avg {game.playtime}h</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{game.name}</h3>
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
                href={`/games/${game.id}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-400/70 hover:text-emerald-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
              >
                RAWG detail <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {game.genres.length ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{game.genres.map((genre) => genre.name).join(", ")}</p>
          ) : null}
          {game.platforms.length ? (
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {game.platforms.map((platform) => platform.name).join(" • ")}
            </p>
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
    </div>
  );
}
