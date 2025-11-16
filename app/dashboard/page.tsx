import Link from "next/link";
import { IgdbFilters } from "@/components/IgdbFilters";
import { CoverImage } from "@/components/CoverImage";
import { PlatformIcon } from "@/lib/platformIcons";
import { buildIgdbImageUrl, type IgdbGame, type IgdbPlatformRef, searchIgdbGames } from "@/lib/igdb";

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

function PlatformBadges({ platforms }: { platforms?: IgdbPlatformRef[] | null }) {
  if (!platforms?.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-600 dark:text-slate-300">
      {platforms.slice(0, 5).map((platform) => (
        <span
          key={platform.id}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 text-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        >
          <PlatformIcon platform={platform.name ?? String(platform.id)} className="h-3.5 w-3.5" />
          <span>{platform.name ?? "Unknown"}</span>
        </span>
      ))}
    </div>
  );
}

function ResultCard({ game }: { game: IgdbGame }) {
  const releaseYear = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null;
  const coverImage = game.cover?.image_id ? buildIgdbImageUrl(game.cover.image_id, "cover_big") : null;
  const igdbHref = game.slug ? `https://www.igdb.com/games/${game.slug}` : null;
  const ratingValue = typeof game.total_rating === "number" ? game.total_rating : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex gap-4">
        <div className="relative h-32 w-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <CoverImage
            gameName={game.name}
            initialImage={coverImage}
            className="absolute inset-0"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{game.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {releaseYear ? `Released ${releaseYear}` : "Release date TBA"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-200">
            {ratingValue !== null ? <span>IGDB {ratingValue.toFixed(1)}</span> : <span>No rating yet</span>}
            {typeof game.total_rating_count === "number" ? <span>{game.total_rating_count} votes</span> : null}
          </div>
        </div>
      </div>
      <PlatformBadges platforms={game.platforms} />
      {igdbHref ? (
        <div className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
          <Link href={igdbHref} target="_blank" rel="noreferrer">View on IGDB</Link>
        </div>
      ) : null}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { q, sort, platform, genre, tags, from, to, mc_min, mc_max, page } = searchParams;

  const dates = from && to ? `${from},${to}` : undefined;
  const metacritic = mc_min && mc_max ? `${mc_min},${mc_max}` : undefined;
  const currentPage = page ? Number(page) : 1;

  const data = await searchIgdbGames({
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
  const hasNext = currentPage * data.pageSize < data.total;

  return (
    <div className="space-y-6">
      <IgdbFilters
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
              Showing {results.length} of {data.total ?? 0} games
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
