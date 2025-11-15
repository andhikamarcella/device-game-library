import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Clock, Star, Users } from "lucide-react";

import {
  getGameDetails,
  getGameMovies,
  getGameReviews,
  getGameScreenshots,
  getSimilarGames,
  type RawgGameDetails,
} from "@/lib/rawg";
import { getUserGameByRawgId } from "@/lib/user-games";
import { ExpandableText } from "@/components/game/ExpandableText";
import { GameActionsPanel } from "@/components/game/GameActionsPanel";
import { ScreenshotGallery } from "@/components/game/ScreenshotGallery";
import { SimilarGamesRow } from "@/components/game/SimilarGamesRow";
import { VideoPlayer } from "@/components/game/VideoPlayer";

export const revalidate = 300;

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

type Review = {
  id: number;
  text: string;
  rating: number | null;
  createdAt: string | null;
  author: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString();
};

const coerceArray = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value ?? "");

export default async function GameDetailPage({ params, searchParams }: PageProps) {
  const rawParam = params.id;
  const parsedId = Number.parseInt(rawParam, 10);
  const identifier: number | string = Number.isFinite(parsedId) ? parsedId : rawParam;

  let game: RawgGameDetails;

  try {
    game = await getGameDetails(identifier);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  const rawgId = game.id;
  const [screenshots, movies, similarGames, reviewsRaw, libraryEntry] = await Promise.all([
    getGameScreenshots(rawgId, 1, 12).catch(() => []),
    getGameMovies(rawgId).catch(() => []),
    getSimilarGames(rawgId, 1, 8).catch(() => []),
    getGameReviews(rawgId, 1, 6).catch(() => []),
    getUserGameByRawgId(rawgId).catch(() => null),
  ]);

  const screenshotMap = new Map<string, { id: number; image: string; width?: number; height?: number }>();
  game.short_screenshots?.forEach((shot) => {
    if (shot?.image) screenshotMap.set(shot.image, shot);
  });
  screenshots.forEach((shot) => {
    if (shot?.image) screenshotMap.set(shot.image, shot);
  });
  const gallery = Array.from(screenshotMap.values());

  const playableMovie = movies.find((movie) => movie.data?.max || movie.data?.["480"]);
  const videoUrl = playableMovie?.data?.max ?? playableMovie?.data?.["480"] ?? null;
  const similar = similarGames.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    coverImage: item.background_image,
    rating: item.rating,
    released: item.released,
    parentPlatforms: item.parent_platforms?.map(({ platform }) => platform) ?? [],
  }));

  const cleanedReviews: Review[] = reviewsRaw
    .map((review) => {
      const text = (review.text ?? "").replace(/<[^>]+>/g, "").trim();
      if (!text) return null;
      const rating =
        typeof review.rating === "number"
          ? review.rating
          : typeof review.rating === "string"
            ? Number.parseFloat(review.rating)
            : null;
      return {
        id: review.id,
        text,
        rating: Number.isFinite(rating ?? NaN) ? Number(rating) : null,
        createdAt: review.created ?? null,
        author: review.user?.username ?? "RAWG user",
      } satisfies Review;
    })
    .filter((value): value is Review => Boolean(value));

  const description = game.description_raw ?? game.description ?? "No description available.";
  const releaseDate = formatDate(game.released);
  const developers = game.developers?.map((developer) => developer.name) ?? [];
  const publishers = game.publishers?.map((publisher) => publisher.name) ?? [];
  const platforms = game.platforms?.map((entry) => entry.platform.name) ?? [];
  const genres = game.genres?.map((genre) => genre.name) ?? [];
  const ratingLabel = Number.isFinite(game.rating) ? game.rating.toFixed(1) : "—";
  const ratingCountLabel = Number.isFinite(game.ratings_count) ? game.ratings_count.toLocaleString() : "—";
  const heroImage = game.background_image_additional ?? game.background_image ?? gallery[0]?.image ?? null;
  const coverImage = game.background_image ?? game.background_image_additional ?? gallery[0]?.image ?? null;

  const queryParam = coerceArray(searchParams?.q);
  const platformParam = coerceArray(searchParams?.platform);
  const pageParam = coerceArray(searchParams?.page);
  const backParams = new URLSearchParams();
  if (queryParam) backParams.set("q", queryParam);
  if (platformParam) backParams.set("platform", platformParam);
  if (pageParam) backParams.set("page", pageParam);
  const backHref = backParams.size > 0 ? `/?${backParams.toString()}` : "/";

  return (
    <div className="space-y-10 pb-16">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 transition hover:text-emerald-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
        {heroImage ? (
          <div className="relative h-72 w-full overflow-hidden">
            <img src={heroImage} alt="Game artwork" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/90 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-8 p-6 md:p-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {coverImage ? (
                <div className="relative mx-auto h-48 w-36 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-200/60 shadow-md shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-800/60">
                  <img src={coverImage} alt={`${game.name} cover art`} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{game.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Released {releaseDate}</p>
                {platforms.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
                    {platforms.map((platform) => (
                      <span key={platform} className="rounded-full border border-slate-200/70 px-3 py-1 dark:border-slate-700">
                        {platform}
                      </span>
                    ))}
                  </div>
                ) : null}
                {genres.length ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">Genres: {genres.join(", ")}</p>
                ) : null}
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  {developers.length ? <span>Developed by {developers.join(", ")}</span> : null}
                  {publishers.length ? <span>Published by {publishers.join(", ")}</span> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start rounded-3xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-amber-500 shadow-sm dark:border-amber-400/40 dark:bg-amber-400/10">
              <Star className="h-5 w-5" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-200">{ratingLabel}</p>
                <p className="text-xs text-amber-500/80 dark:text-amber-200/80">{ratingCountLabel} RAWG ratings</p>
              </div>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Description</h2>
                <ExpandableText text={description} maxLength={450} />
              </section>

              {playableMovie && videoUrl ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Video</h2>
                  <VideoPlayer title={playableMovie.name} videoUrl={videoUrl} preview={playableMovie.preview} />
                </section>
              ) : null}

              {gallery.length ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Screenshots</h2>
                  <ScreenshotGallery screenshots={gallery.map((shot) => ({ id: shot.id, image: shot.image, width: shot.width, height: shot.height }))} />
                </section>
              ) : null}

              {cleanedReviews.length ? (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                    <Users className="h-4 w-4" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Community reviews</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {cleanedReviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          {review.author}
                        </p>
                        <p className="mt-2 whitespace-pre-line">{review.text}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(review.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {review.rating ?? "—"}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">My progress</h2>
                <GameActionsPanel
                  metadata={{
                    rawgId,
                    slug: game.slug,
                    title: game.name,
                    coverImage,
                    platforms,
                    genres,
                    released: game.released,
                    rating: game.rating ?? null,
                    ratingsCount: game.ratings_count ?? null,
                    playtime: game.playtime ?? null,
                  }}
                  entry={libraryEntry}
                />
              </section>

              <section className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Metacritic {game.metacritic ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>RAWG playtime {game.playtime ? `${game.playtime}h` : "Unknown"}</span>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>

      {similar.length ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Similar games</h2>
          <SimilarGamesRow games={similar} />
        </section>
      ) : null}
    </div>
  );
}
