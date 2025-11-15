import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ExpandableText } from "@/components/game/ExpandableText";
import { GameActionsPanel } from "@/components/game/GameActionsPanel";
import { ScreenshotGallery } from "@/components/game/ScreenshotGallery";
import { SimilarGamesRow, type SimilarGame } from "@/components/game/SimilarGamesRow";
import { VideoPlayer } from "@/components/game/VideoPlayer";
import type { FusedGameDetail } from "@/app/api/games/[id]/full/route";

async function loadGameDetail(id: string): Promise<FusedGameDetail> {
  const headersList = headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  if (!host) {
    throw new Error("Unable to determine request host");
  }
  const baseUrl = `${protocol}://${host}`;
  const response = await fetch(`${baseUrl}/api/games/${encodeURIComponent(id)}/full`, { cache: "no-store" });
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load game detail: ${text}`);
  }
  return response.json() as Promise<FusedGameDetail>;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
  } catch {
    return date;
  }
}

function formatPlaytime(value?: number | null) {
  if (!value) return "—";
  return `${value}h avg playtime`;
}

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const fused = await loadGameDetail(params.id);
  const { rawg, screenshots, video, similar, boxart } = fused;

  const heroImage = rawg.background_image_additional ?? rawg.background_image ?? screenshots[0]?.image ?? null;
  const coverImage = boxart?.url ?? rawg.background_image ?? null;
  const description = rawg.description_raw ?? rawg.description ?? "No description available.";

  const similarGames: SimilarGame[] = similar.map((game) => ({
    id: game.id,
    slug: game.slug,
    name: game.name,
    coverImage: game.background_image ?? null,
    rating: game.rating ?? null,
    parentPlatforms:
      game.parent_platforms?.map(({ platform }) => ({ id: platform.id, name: platform.name, slug: platform.slug })) ?? [],
    released: game.released,
  }));

  return (
    <div className="space-y-12 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900">
        {heroImage && (
          <div className="absolute inset-0">
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        )}
        <div className="relative grid gap-10 p-8 md:grid-cols-[220px_1fr] md:p-12">
          <div className="flex flex-col items-start gap-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-2xl shadow-slate-900/30 dark:border-slate-800 dark:bg-slate-900">
              {coverImage ? (
                <div
                  aria-hidden
                  className="h-64 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverImage})` }}
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center text-sm text-slate-400">No cover art available</div>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              ← Back to search
            </Link>
          </div>
          <div className="space-y-6 text-slate-100">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold md:text-4xl">{rawg.name}</h1>
              <p className="text-sm text-slate-300">
                {formatDate(rawg.released)} · {rawg.parent_platforms?.map(({ platform }) => platform.name).join(", ") || "Platforms unknown"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {rawg.genres?.map((genre) => (
                  <span key={genre.id} className="rounded-full bg-slate-800/80 px-3 py-1">
                    {genre.name}
                  </span>
                ))}
                {rawg.metacritic && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Metacritic {rawg.metacritic}</span>
                )}
                <span className="rounded-full bg-slate-800/80 px-3 py-1">RAWG {rawg.rating?.toFixed(1) ?? "—"}</span>
                <span className="rounded-full bg-slate-800/80 px-3 py-1">{formatPlaytime(rawg.playtime)}</span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</h2>
                  <div className="mt-3">
                    <ExpandableText text={description} />
                  </div>
                </div>
                {rawg.developers?.length ? (
                  <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Developers</h3>
                      <p>{rawg.developers.map((dev) => dev.name).join(", ")}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publishers</h3>
                      <p>{rawg.publishers?.map((publisher) => publisher.name).join(", ") || "—"}</p>
                    </div>
                  </div>
                ) : null}
                {rawg.stores?.length ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stores</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {rawg.stores.map((store) => (
                        <a
                          key={store.id}
                          href={store.url ?? `https://${store.store.domain ?? ""}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200 transition hover:bg-emerald-500/30"
                        >
                          {store.store.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <GameActionsPanel
                rawgId={rawg.id}
                slug={rawg.slug}
                title={rawg.name}
                coverImage={coverImage}
                platforms={rawg.parent_platforms?.map(({ platform }) => platform.name) ?? []}
                genres={rawg.genres?.map((genre) => genre.name) ?? []}
                releaseYear={rawg.released ? Number.parseInt(rawg.released.slice(0, 4), 10) : null}
                rating={rawg.rating}
                ratingsCount={rawg.ratings_count}
                playtime={rawg.playtime}
                metacritic={rawg.metacritic ?? null}
                boxArtSource={boxart?.source}
              />
            </div>
          </div>
        </div>
      </div>

      {video && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trailer & gameplay</h2>
          <VideoPlayer source={video} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Screenshots</h2>
        <ScreenshotGallery screenshots={screenshots} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Similar games</h2>
        <SimilarGamesRow games={similarGames} />
      </section>
    </div>
  );
}

