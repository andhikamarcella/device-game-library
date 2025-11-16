import Image from "next/image";
import Link from "next/link";
import { RawgFilters } from "@/components/RawgFilters";
import { PlatformIcon } from "@/lib/platformIcons";
import { RawgGame, RawgPlatform, searchGames } from "@/lib/rawg";

interface DashboardPageProps {
  searchParams: {
    q?: string;
    sort?: string;
    platform?: string;
    genre?: string;
    tags?: string;
    from?: string;
    to?: string;
    mc_min?: string;
    mc_max?: string;
    page?: string;
  };
}

function buildPageLink(params: DashboardPageProps["searchParams"], targetPage: number): string {
  const next = new URLSearchParams();

  if (params.q) next.set("q", params.q);
  if (params.sort) next.set("sort", params.sort);
  if (params.platform) next.set("platform", params.platform);
  if (params.genre) next.set("genre", params.genre);
  if (params.tags) next.set("tags", params.tags);
  if (params.from) next.set("from", params.from);
  if (params.to) next.set("to", params.to);
  if (params.mc_min) next.set("mc_min", params.mc_min);
  if (params.mc_max) next.set("mc_max", params.mc_max);

  next.set("page", String(targetPage));

  return `?${next.toString()}`;
}

function PlatformBadges({ platforms }: { platforms?: RawgPlatform[] | null }) {
  if (!platforms?.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-600 dark:text-slate-300">
      {platforms.slice(0, 5).map((entry) => (
        <span
          key={entry.platform.id}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 text-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        >
          <PlatformIcon platform={entry.platform.name ?? entry.platform.slug} className="h-3.5 w-3.5" />
          <span>{entry.platform.name}</span>
        </span>
      ))}
    </div>
  );
}

function ResultCard({ game }: { game: RawgGame }) {
  const releaseYear = game.released ? new Date(game.released).getFullYear() : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex gap-4">
        <div className="relative h-32 w-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {game.background_image ? (
            <Image src={game.background_image} alt={game.name} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No art</div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{game.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {releaseYear ? `Released ${releaseYear}` : "Release date TBA"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-200">
            {typeof game.rating === "number" ? <span>Rating {game.rating.toFixed(1)}</span> : null}
            {typeof game.metacritic === "number" ? <span>Metacritic {game.metacritic}</span> : null}
            {typeof game.playtime === "number" && game.playtime > 0 ? <span>{game.playtime}h avg playtime</span> : null}
          </div>
        </div>
      </div>
      <PlatformBadges platforms={game.platforms} />
      <div className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
        <Link href={`/games/${game.id}`}>View details</Link>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { q, sort, platform, genre, tags, from, to, mc_min, mc_max, page } = searchParams;

  const dates = from && to ? `${from},${to}` : undefined;
  const metacritic = mc_min && mc_max ? `${mc_min},${mc_max}` : undefined;
  const currentPage = page ? Number(page) : 1;

  const data = await searchGames({
    search: q,
    ordering: sort,
    platforms: platform,
    genres: genre,
    tags,
    dates,
    metacritic,
    page: currentPage,
    page_size: 24,
  });

  const results = data.results ?? [];
  const hasPrev = currentPage > 1;
  const hasNext = Boolean(data.next);

  return (
    <div className="space-y-6">
      <RawgFilters
        initialQuery={q}
        initialSort={sort}
        initialPlatform={platform}
        initialGenre={genre}
        initialFrom={from}
        initialTo={to}
        initialMcMin={mc_min}
        initialMcMax={mc_max}
        initialTags={tags}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Results</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {results.length} of {data.count ?? 0} games
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Page {currentPage}</span>
          </div>
        </div>

        {results.length ? (
          <div className="space-y-4">
            {results.map((game) => (
              <ResultCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No games found. Try adjusting your filters.
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            aria-disabled={!hasPrev}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-500 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            href={hasPrev ? buildPageLink(searchParams, currentPage - 1) : "#"}
          >
            Previous
          </Link>
          <Link
            aria-disabled={!hasNext}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-500 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            href={hasNext ? buildPageLink(searchParams, currentPage + 1) : "#"}
          >
            Next
          </Link>
        </div>
      </section>
    </div>
  );
}
