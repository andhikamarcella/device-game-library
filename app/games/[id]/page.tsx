import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Star, MessageCircle, Clapperboard, BarChart3, Users, Tag, Layers } from "lucide-react";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { getPlatformIcon } from "@/components/platform-icons";
import { GameTrailerSection } from "@/components/game/GameTrailerSection";
import {
  getGameDetails,
  getGameReviews,
  getGameScreenshots,
  getGameTrailers,
  getSimilarGames,
  type RawgGameDetails,
  type RawgMovie,
  type RawgSimilarGame,
} from "@/lib/rawg";

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

  const platformDetails =
    game.platforms?.map((entry) => ({
      id: entry.platform.id,
      name: entry.platform.name,
      slug: entry.platform.slug,
    })) ?? [];

  const screenshotsPromise = getGameScreenshots(id, 1, 12).catch(
    () => [] as Awaited<ReturnType<typeof getGameScreenshots>>,
  );
  const reviewsPromise = getGameReviews(id, 1, 6).catch(
    () => [] as Awaited<ReturnType<typeof getGameReviews>>,
  );
  const trailersPromise = getGameTrailers(id).catch(() => [] as RawgMovie[]);
  const similarPromise = getSimilarGames(id).catch(() => [] as RawgSimilarGame[]);
  const [screenshots, reviews, trailers, similarGames] = await Promise.all([
    screenshotsPromise,
    reviewsPromise,
    trailersPromise,
    similarPromise,
  ]);

  const trailerReadyGame: RawgGameDetails = { ...game, movies: trailers };

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
  const seenPlatformSlugs = new Set<string>();
  const uniquePlatforms = platformDetails.filter((platform) => {
    const slug = (platform.slug ?? platform.name?.toLowerCase()) ?? null;
    if (!slug) {
      return false;
    }
    if (seenPlatformSlugs.has(slug)) {
      return false;
    }
    seenPlatformSlugs.add(slug);
    return true;
  });
  const platformNames = uniquePlatforms.map((platform) => platform.name).filter(Boolean);
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

  const playtimeHours = typeof game.playtime === "number" && game.playtime > 0 ? Math.round(game.playtime) : null;
  const addedByStatusEntries = Object.entries(game.added_by_status ?? {})
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([key, value]) => ({ key, value }));

  const addedStatusLabels: Record<string, string> = {
    yet: "Backlog",
    owned: "Owned",
    beaten: "Beaten",
    toplay: "To-play",
    dropped: "Dropped",
    playing: "Playing",
    completed: "Completed",
    wishlist: "Wishlist",
    replay: "Replay",
    paused: "Paused",
    main: "Main",
    custom: "Custom",
    collecting: "Collecting",
  };

  const ratingBreakdown = (game.ratings ?? []).filter((rating) => rating.count > 0);

  const tagEntries = game.tags ?? [];
  const modeKeywordMap = new Map<string, string>([
    ["single-player", "Single-player"],
    ["multiplayer", "Multiplayer"],
    ["coop", "Co-op"],
    ["co-op", "Co-op"],
    ["local-co-op", "Local Co-op"],
    ["local-multiplayer", "Local Multiplayer"],
    ["online", "Online"],
    ["pvp", "Online PvP"],
    ["split-screen", "Split-screen"],
  ]);

  const modeLabels: string[] = [];
  const seenModes = new Set<string>();
  tagEntries.forEach((tag) => {
    const slug = tag.slug?.toLowerCase() ?? "";
    const name = tag.name?.toLowerCase() ?? "";
    modeKeywordMap.forEach((label, keyword) => {
      if (slug.includes(keyword) || name.includes(keyword)) {
        if (!seenModes.has(label)) {
          seenModes.add(label);
          modeLabels.push(label);
        }
      }
    });
  });

  const displayTags = tagEntries
    .map((tag) => tag.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 10);

  const seriesCandidates: { label: string; href?: string }[] = [];
  const parentGame = game.parent_game;
  if (parentGame?.name) {
    const target = parentGame.slug ?? (typeof parentGame.id === "number" ? String(parentGame.id) : undefined);
    const href = target ? `/games/${target}` : undefined;
    seriesCandidates.push({ label: parentGame.name, href });
  }
  const rawSeriesEntries = Array.isArray(game.series)
    ? game.series
    : game.series && "results" in game.series && Array.isArray(game.series.results)
      ? game.series.results ?? []
      : [];
  rawSeriesEntries.forEach((entry) => {
    if (entry?.name) {
      const target = entry.slug ?? (typeof entry.id === "number" ? String(entry.id) : undefined);
      const href = target ? `/games/${target}` : undefined;
      seriesCandidates.push({ label: entry.name, href });
    }
  });
  const uniqueSeries = seriesCandidates.filter(
    (entry, index, array) => array.findIndex((candidate) => candidate.label === entry.label) === index,
  );

  const backParams = new URLSearchParams();
  const qParam = getSingleParamValue(searchParams?.q)?.trim();
  const platformParam = getSingleParamValue(searchParams?.platform)?.trim();
  const pageParam = getSingleParamValue(searchParams?.page)?.trim();
  const returnToParam = getSingleParamValue(searchParams?.returnTo)?.trim();

  const sanitizedReturnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : null;

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

  const backHref = sanitizedReturnTo ?? (backParams.size > 0 ? `/?${backParams.toString()}` : "/");
  const backLabel = sanitizedReturnTo?.startsWith("/library") ? "Back to library" : "Back to search";

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
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
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Available on
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      {uniquePlatforms.map((platform) => (
                        <span
                          key={platform.id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          {getPlatformIcon(platform.slug, platform.name)}
                          <span>{platform.name}</span>
                        </span>
                      ))}
                    </div>
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

          {playtimeHours || addedByStatusEntries.length ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Game stats</h2>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-200">
                {playtimeHours ? <span>Average playtime: {playtimeHours} hours</span> : null}
                {addedByStatusEntries.map(({ key, value }) => (
                  <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                    {addedStatusLabels[key] ?? key}: {value.toLocaleString()}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {ratingBreakdown.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Star className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Rating breakdown</h2>
              </div>
              <div className="space-y-2">
                {ratingBreakdown.map((rating) => (
                  <div key={rating.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      <span>{rating.title}</span>
                      <span>{Math.round(rating.percent)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                        style={{ width: `${Math.max(0, Math.min(rating.percent, 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {modeLabels.length ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Users className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Modes & players</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {modeLabels.map((label) => (
                  <span key={label} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {displayTags.length ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Tag className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {uniqueSeries.length ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Part of the series</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-200">
                {uniqueSeries.map((entry) =>
                  entry.href ? (
                    <Link
                      key={entry.label}
                      href={entry.href}
                      className="rounded-full border border-emerald-500/40 px-3 py-1 text-emerald-600 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      {entry.label}
                    </Link>
                  ) : (
                    <span key={entry.label} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/80">
                      {entry.label}
                    </span>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {gallery.length ? <ScreenshotGallery screenshots={gallery} /> : null}

          <GameTrailerSection game={trailerReadyGame} />

          {similarGames.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-widest">Similar games</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similarGames.slice(0, 6).map((similar) => {
                  const similarPlatforms =
                    similar.platforms?.slice(0, 3).map((platform) => ({
                      id: platform.platform.id,
                      name: platform.platform.name,
                      slug: platform.platform.slug,
                    })) ?? [];

                  return (
                    <Link
                      key={similar.id}
                      href={`/games/${similar.slug ?? similar.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="relative h-40 w-full overflow-hidden">
                        {similar.background_image ? (
                          <img
                            src={similar.background_image}
                            alt={`${similar.name} artwork`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            No image
                          </div>
                        )}
                        {Number.isFinite(similar.rating) && similar.rating > 0 ? (
                          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {similar.rating.toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
                          {similar.name}
                        </h3>
                        {similarPlatforms.length ? (
                          <div className="flex items-center gap-2">
                            {similarPlatforms.map((platform) => (
                              <span key={platform.id}>{getPlatformIcon(platform.slug, platform.name)}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
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
