import Link from "next/link";

export type SimilarGame = {
  id: number;
  slug: string;
  name: string;
  coverImage: string | null;
  rating?: number | null;
  parentPlatforms: { id: number; name: string; slug: string }[];
  released: string | null;
};

export function SimilarGamesRow({ games }: { games: SimilarGame[] }) {
  if (!games.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/games/${game.slug ?? game.id}`}
          className="group flex flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/40 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
            {game.coverImage ? (
              <img src={game.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">No art</div>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-500 dark:text-white">
              {game.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {game.released ?? "Unknown"} · {game.parentPlatforms.map((platform) => platform.name).join(", ") || "Unknown"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">RAWG {formatRating(game.rating)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatRating(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "—";
}
