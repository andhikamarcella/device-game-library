import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Star, Camera, MessageCircle, Clapperboard } from "lucide-react";
import { getGameDetails, getGameReviews, getGameScreenshots, getGameTrailers } from "@/lib/rawg";
import type { RawgGameDetails, RawgMovie } from "@/lib/rawg";
import { getGameplayVideos, type YoutubeVideo } from "@/lib/youtube";

export const revalidate = 300;

type GameDetailPageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const getSingleParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === "string" ? value : null;
};

export default async function GameDetailPage({ params, searchParams }: GameDetailPageProps) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    notFound();
  }

  let game: RawgGameDetails;

  try {
    game = await getGameDetails(id);
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) {
      notFound();
    }
    throw error;
  }

  const screenshotsPromise = getGameScreenshots(id, 1, 12).catch(
    () => [] as Awaited<ReturnType<typeof getGameScreenshots>>,
  );
  const reviewsPromise = getGameReviews(id, 1, 6).catch(
    () => [] as Awaited<ReturnType<typeof getGameReviews>>,
  );
  const trailersPromise = getGameTrailers(id).catch(() => [] as RawgMovie[]);
  const youtubePromise = getGameplayVideos(game.name).catch(() => [] as YoutubeVideo[]);
  const [screenshots, reviews, trailers, youtubeVideos] = await Promise.all([
    screenshotsPromise,
    reviewsPromise,
    trailersPromise,
    youtubePromise,
  ]);

  const screenshotMap = new Map<string, { id: number; image: string; width?: number; height?: number }>();
  game.short_screenshots?.forEach((shot) => {
    if (shot?.image) {
      screenshotMap.set(shot.image, shot);
    }
  });
  screenshots.forEach((shot) => {
    if (shot?.image) {
      screenshotMap.set(shot.image, shot);
    }
  });

  const gallery = Array.from(screenshotMap.values());

  const cleanedReviews = reviews
    .map((review) => {
      const rawText = review.text ?? "";
      const text = rawText.replace(/<[^>]+>/g, "").trim();
      if (!text) return null;
      const parsedRating =
        typeof review.rating === "number"
          ? review.rating
          : typeof review.rating === "string"
            ? Number.parseFloat(review.rating)
            : NaN;
      return {
        id: review.id,
        text,
        rating: Number.isFinite(parsedRating) ? parsedRating : null,
        createdAt: review.created ?? null,
        author: review.user?.username ?? "RAWG user",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 3);

  const description = game.description_raw ?? game.description ?? "No description available.";
  const releaseDateLabel = (() => {
    if (!game.released) {
      return "Unknown";
    }
    const parsed = new Date(game.released);
    return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
  })();
  const platformNames = game.platforms?.map((entry) => entry.platform.name).filter(Boolean) ?? [];
  const genres = game.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
  const developers = game.developers?.map((developer) => developer.name).filter(Boolean) ?? [];
  const publishers = game.publishers?.map((publisher) => publisher.name).filter(Boolean) ?? [];
  const ratingLabel = Number.isFinite(game.rating) ? game.rating.toFixed(1) : "—";
  const ratingCountLabel = Number.isFinite(game.ratings_count) ? game.ratings_count : 0;
  const heroImage = game.background_image_additional ?? game.background_image;
  const thumbnailImage = game.background_image ?? game.background_image_additional ?? gallery[0]?.image ?? null;

  const formatReviewDate = (value: string | null) => {
    if (!value) return "Date unknown";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Date unknown" : parsed.toLocaleDateString();
  };

  const backParams = new URLSearchParams();
  const qParam = getSingleParamValue(searchParams?.q)?.trim();
  const platformParam = getSingleParamValue(searchParams?.platform)?.trim();
  const pageParam = getSingleParamValue(searchParams?.page)?.trim();

  if (qParam) {
    backParams.set("q", qParam);
  }
  if (platformParam) {
    backParams.set("platform", platformParam);
  }
  if (pageParam) {
    const parsedPage = Number.parseInt(pageParam, 10);
    if (Number.isFinite(parsedPage) && parsedPage > 0) {
      backParams.set("page", String(parsedPage));
    }
  }

  const backHref = backParams.size > 0 ? `/?${backParams.toString()}` : "/";

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
        {heroImage ? (
          <div className="relative h-72 w-full overflow-hidden">
            <img src={heroImage} alt={`${game.name} artwork`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-8 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-start">
              {thumbnailImage ? (
                <div className="relative mx-auto h-40 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={thumbnailImage}
                    alt={`${game.name} cover art`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{game.name}</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Released: {releaseDateLabel}</p>
                </div>
                {platformNames.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {platformNames.map((platform) => (
                      <span key={platform} className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                        {platform}
                      </span>
                    ))}
                  </div>
                ) : null}
                {genres.length ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">Genres: {genres.join(", ")}</p>
                ) : null}
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                  {developers.length ? <span>Developed by {developers.join(", ")}</span> : null}
                  {publishers.length ? <span>Published by {publishers.join(", ")}</span> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-amber-400/60 bg-amber-100 px-4 py-3 text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <Star className="h-5 w-5 fill-current" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">{ratingLabel}</p>
                <p className="text-xs text-amber-600 dark:text-amber-100/80">{ratingCountLabel} ratings</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">{description}</p>
          </div>

          {gallery.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Camera className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Screenshots</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">Scroll to explore the gallery</span>
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                role="list"
                aria-label={`Screenshots for ${game.name}`}
              >
                {gallery.map((shot) => (
                  <div
                    key={`${shot.id}-${shot.image}`}
                    className="relative h-44 w-64 flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-800"
                    role="listitem"
                  >
                    <img
                      src={shot.image}
                      alt={`${game.name} screenshot`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {trailers.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Clapperboard className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">RAWG trailers</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {trailers.slice(0, 2).map((trailer) => {
                  const sources = trailer.data ?? {};
                  const src = sources.max ?? sources["1080"] ?? sources["720"] ?? sources[480];
                  if (!src) {
                    return null;
                  }
                  return (
                    <figure
                      key={trailer.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800"
                    >
                      <video
                        controls
                        poster={trailer.preview ?? undefined}
                        className="h-64 w-full object-cover"
                      >
                        <source src={src} type="video/mp4" />
                      </video>
                      <figcaption className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {trailer.name}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          ) : null}

          {youtubeVideos.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Clapperboard className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Gameplay videos</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {youtubeVideos.slice(0, 3).map((video) => (
                  <article
                    key={video.videoId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <iframe
                      title={video.title}
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-64 w-full"
                    />
                    <div className="px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {video.channelTitle || "YouTube"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-widest">Community reviews</h2>
            </div>
            {cleanedReviews.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {cleanedReviews.map((review) => (
                  <article
                    key={review.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{review.author}</p>
                      {typeof review.rating === "number" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-200">
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          {review.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{review.text}</p>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{formatReviewDate(review.createdAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No public RAWG reviews are available for this game yet.</p>
            )}
          </section>

          {game.website ? (
            <div>
              <a
                href={game.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                <Globe className="h-4 w-4" aria-hidden="true" /> Official website
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
