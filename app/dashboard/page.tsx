import Link from "next/link";
import { IgdbFilters } from "@/components/IgdbFilters";
import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import { igdbCoverUrl } from "@/lib/igdbImages";
import { type IgdbGame, type IgdbPlatformRef, searchIgdbGames } from "@/lib/igdb";

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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { q, sort, platform, genre, tags, from, to, mc_min, mc_max, page } = searchParams;

  const dates = from && to ? `${from},${to}` : undefined;
  const metacritic = mc_min && mc_max ? `${mc_min},${mc_max}` : undefined;
  const currentPage = page ? Number(page) : 1;
  const pageSize = 6;

  const data = await searchIgdbGames({
    search: q,
    ordering: sort,
    platforms: platform,
    genres: genre,
    tags,
    dates,
    metacritic,
    page: currentPage,
    page_size: pageSize,
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
            {results.map((game) => {
              const releaseYear = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null;
              const cardData: CompactGameCardData = {
                id: game.id,
                name: game.name,
                coverImageId: game.cover?.image_id ?? null,
                coverUrl: igdbCoverUrl(game.cover?.image_id ?? null),
                rating: game.total_rating ?? game.rating ?? null,
                ratingsCount: game.total_rating_count ?? game.rating_count ?? null,
                releaseYear,
                platforms: game.platforms?.map((platform) => ({
                  id: platform.id,
                  name: platform.name,
                  abbreviation: platform.abbreviation ?? null,
                })),
              };
              const igdbHref = game.slug ? `https://www.igdb.com/games/${game.slug}` : null;
              return (
                <GameCardCompact
                  key={game.id}
                  game={cardData}
                  footer={
                    igdbHref ? (
                      <Link
                        href={igdbHref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
                      >
                        View on IGDB
                      </Link>
                    ) : null
                  }
                />
              );
            })}
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
