"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Star } from "lucide-react";
import { GameStatusControls } from "@/components/GameStatusControls";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { SimilarGamesRow } from "@/components/SimilarGamesRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { YoutubeVideoGrid } from "@/components/YoutubeVideoGrid";
import { useLibrary, type UserGame } from "@/hooks/LibraryProvider";
import { normalizeRawgImageUrl } from "@/lib/images";

interface GameDetailsResponse {
  id: number;
  slug: string;
  name: string;
  description_raw: string | null;
  background_image: string | null;
  background_image_additional: string | null;
  released: string | null;
  playtime: number | null;
  metacritic: number | null;
  esrb_rating: { id: number; name: string } | null;
  parent_platforms: Array<{ id: number; name: string; slug: string }>;
  genres: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
  developers: Array<{ id: number; name: string }>;
  publishers: Array<{ id: number; name: string }>;
  stores: Array<{ id: number; name: string; domain: string | null; slug: string }>;
  rating: number | null;
  ratings_count: number | null;
}

interface ScreenshotResponse {
  results: Array<{ id: number; image: string; width?: number; height?: number }>;
}

interface MoviesResponse {
  results: Array<{ id: number; name: string; preview: string | null; data: { 480?: string; max?: string } }>;
}

interface SimilarResponse {
  results: Array<{
    id: number;
    name: string;
    slug: string;
    background_image: string | null;
    rating: number | null;
    released: string | null;
    parent_platforms: Array<{ id: number; name: string; slug: string }>;
  }>;
}

interface YoutubeResponse {
  results: Array<{
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnails: Record<string, { url: string }>;
  }>;
}

interface PlatformVideoGroup {
  slug: string;
  name: string;
  videos: YoutubeResponse["results"];
}

export default function GameDetailsPage() {
  const params = useParams<{ id: string }>();
  const gameId = Number.parseInt(params.id, 10);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { games, upsert, update, remove } = useLibrary();
  const currentRoute = useMemo(() => {
    const base = pathname || `/library/${params.id}`;
    const query = searchParams?.toString();
    return query ? `${base}?${query}` : base;
  }, [pathname, searchParams, params.id]);
  const userGame = useMemo(() => games.find((item) => item.rawgId === gameId), [games, gameId]);

  const [details, setDetails] = useState<GameDetailsResponse | null>(null);
  const [screenshots, setScreenshots] = useState<ScreenshotResponse["results"]>([]);
  const [trailers, setTrailers] = useState<MoviesResponse["results"]>([]);
  const [similar, setSimilar] = useState<SimilarResponse["results"]>([]);
  const [youtube, setYoutube] = useState<YoutubeResponse["results"]>([]);
  const [platformVideos, setPlatformVideos] = useState<PlatformVideoGroup[]>([]);
  const [platformVideoError, setPlatformVideoError] = useState<string | null>(null);
  const [platformVideoLoading, setPlatformVideoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(gameId)) {
      setError("Invalid game id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [detailsRes, screenshotsRes, moviesRes, similarRes] = await Promise.all([
          fetch(`/api/rawg/details/${gameId}`),
          fetch(`/api/rawg/screenshots/${gameId}`),
          fetch(`/api/rawg/movies/${gameId}`),
          fetch(`/api/rawg/similar/${gameId}`),
        ]);

        if (!detailsRes.ok) {
          const data = await detailsRes.json().catch(() => null);
          throw new Error(data?.error ?? "Unable to load game details.");
        }

        const detailsData = (await detailsRes.json()) as GameDetailsResponse;
        if (cancelled) return;
        setDetails(detailsData);

        if (screenshotsRes.ok) {
          const screenshotData = (await screenshotsRes.json()) as ScreenshotResponse;
          if (!cancelled) {
            setScreenshots(screenshotData.results ?? []);
          }
        }

        if (moviesRes.ok) {
          const movieData = (await moviesRes.json()) as MoviesResponse;
          if (!cancelled) {
            setTrailers(movieData.results ?? []);
          }
        }

        if (similarRes.ok) {
          const similarData = (await similarRes.json()) as SimilarResponse;
          if (!cancelled) {
            setSimilar(
              (similarData.results ?? []).map((game) => ({
                ...game,
                parent_platforms: game.parent_platforms ?? [],
              })),
            );
          }
        }

        if (detailsData.name) {
          try {
            const youtubeRes = await fetch(`/api/youtube/gameplay?q=${encodeURIComponent(detailsData.name)}`);
            if (youtubeRes.ok) {
              const youtubeData = (await youtubeRes.json()) as YoutubeResponse;
              if (!cancelled) {
                setYoutube(youtubeData.results ?? []);
              }
            }
          } catch (youtubeError) {
            console.warn("YouTube fetch error", youtubeError);
          }
        }
      } catch (fetchError) {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load game details.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    if (!details?.name) {
      setPlatformVideos([]);
      setPlatformVideoError(null);
      setPlatformVideoLoading(false);
      return;
    }

    const platforms = (details.parent_platforms ?? []).map((platform) => ({
      slug: platform.slug ?? String(platform.id),
      name: platform.name,
    }));

    if (!platforms.length) {
      setPlatformVideos([]);
      setPlatformVideoError(null);
      setPlatformVideoLoading(false);
      return;
    }

    let cancelled = false;
    const limitedPlatforms = platforms.filter((platform) => platform.name).slice(0, 6);
    if (!limitedPlatforms.length) {
      setPlatformVideos([]);
      setPlatformVideoError(null);
      setPlatformVideoLoading(false);
      return;
    }

    setPlatformVideoLoading(true);
    setPlatformVideoError(null);

    Promise.all(
      limitedPlatforms.map(async (platform) => {
        try {
          const response = await fetch(
            `/api/youtube/gameplay?q=${encodeURIComponent(details.name)}&platform=${encodeURIComponent(platform.name)}&limit=2`,
          );
          const payload = (await response.json().catch(() => null)) as YoutubeResponse | { error?: string } | null;
          if (!response.ok || !payload) {
            throw new Error((payload as { error?: string } | null)?.error ?? "Unable to load platform videos.");
          }
          const results = (payload as YoutubeResponse).results ?? [];
          if (!results.length) {
            return null;
          }
          return { slug: platform.slug, name: platform.name, videos: results.slice(0, 2) } satisfies PlatformVideoGroup;
        } catch (platformError) {
          console.warn("Platform gameplay fetch error", platformError);
          return null;
        }
      }),
    )
      .then((groups) => {
        if (cancelled) {
          return;
        }
        const filtered = groups.filter((group): group is PlatformVideoGroup => Boolean(group));
        setPlatformVideos(filtered);
        if (!filtered.length) {
          setPlatformVideoError("Gameplay per console tidak tersedia.");
        } else {
          setPlatformVideoError(null);
        }
      })
      .catch((platformError) => {
        if (!cancelled) {
          setPlatformVideos([]);
          setPlatformVideoError(platformError instanceof Error ? platformError.message : "Unable to load platform videos.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPlatformVideoLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [details]);

  useEffect(() => {
    if (!details || !userGame) {
      return;
    }
    const platformNames = details.parent_platforms?.map((platform) => platform.name) ?? [];
    const coverCandidate =
      normalizeRawgImageUrl(details.background_image ?? details.background_image_additional ?? null);
    const patch: Partial<UserGame> = {};
    if (!userGame.coverImage && coverCandidate) {
      patch.coverImage = coverCandidate;
    }
    if ((!userGame.platforms || userGame.platforms.length === 0) && platformNames.length) {
      patch.platforms = platformNames;
    }
    if (Object.keys(patch).length > 0) {
      update(details.id, patch);
    }
  }, [details, update, userGame]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading game details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <p className="text-lg font-semibold">Unable to load game</p>
        <p className="mt-2 text-sm">{error}</p>
        <Link href="/library" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="text-lg font-semibold">Game not found</p>
        <p className="mt-2 text-sm">We couldn&rsquo;t load this game. Try searching from the dashboard.</p>
        <Link href="/library" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>
      </div>
    );
  }

  const releaseYear = details.released ? new Date(details.released).getFullYear() : null;
  const heroImage = normalizeRawgImageUrl(details.background_image_additional ?? details.background_image ?? null);
  const coverImage = normalizeRawgImageUrl(details.background_image ?? details.background_image_additional ?? null);
  const platformNames = details.parent_platforms?.map((platform) => platform.name) ?? [];
  const genres = details.genres?.map((genre) => genre.name) ?? [];
  const tags = details.tags?.slice(0, 8).map((tag) => tag.name) ?? [];
  const developers = details.developers?.map((developer) => developer.name) ?? [];
  const publishers = details.publishers?.map((publisher) => publisher.name) ?? [];
  const stores = details.stores?.map((store) => store.name) ?? [];

  const handleAddToLibrary = () => {
    upsert({
      rawgId: details.id,
      slug: details.slug,
      title: details.name,
      coverImage,
      platforms: platformNames,
      playtimeHours: details.playtime ?? 0,
    });
  };

  const rawgDetailHref = `/games/${details.id}?returnTo=${encodeURIComponent(currentRoute)}`;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl dark:border-slate-800">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={details.name}
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            priority
          />
        ) : null}
        <div className="relative flex flex-col gap-6 bg-gradient-to-t from-slate-950/90 via-slate-950/80 to-slate-950/30 p-6 md:flex-row">
          <div className="mx-auto w-44 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700 md:mx-0">
            {coverImage ? (
              <Image src={coverImage} alt={`${details.name} cover`} width={440} height={660} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-900 text-slate-500">No cover</div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/library" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200">
                <ArrowLeft className="h-4 w-4" /> Back to library
              </Link>
              {releaseYear ? <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{releaseYear}</span> : null}
              {details.playtime ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">Avg {details.playtime}h</span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{details.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              {genres.length ? <span>{genres.join(" • ")}</span> : null}
              {platformNames.length ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {platformNames.join(" / ")}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {typeof details.rating === "number" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1">
                  <Star className="h-4 w-4 text-amber-300" /> RAWG {details.rating.toFixed(1)}
                  {details.ratings_count ? <span className="text-xs text-slate-200/80">({details.ratings_count.toLocaleString()} reviews)</span> : null}
                </div>
              ) : null}
              {details.metacritic ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1">
                  <span className="text-sm font-semibold">Metacritic</span> {details.metacritic}
                </div>
              ) : null}
              {details.esrb_rating ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1">ESRB {details.esrb_rating.name}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {developers.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Developers</p>
                  <p>{developers.join(", ")}</p>
                </div>
              ) : null}
              {publishers.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Publishers</p>
                  <p>{publishers.join(", ")}</p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {userGame ? (
                <GameStatusControls userGame={userGame} onUpdate={update} onRemove={remove} />
              ) : (
                <button
                  type="button"
                  onClick={handleAddToLibrary}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Save to library
                </button>
              )}
              <Link
                href={rawgDetailHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white"
              >
                RAWG detail page <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {details.description_raw ? (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">About this game</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {descriptionExpanded ? details.description_raw : `${details.description_raw.slice(0, 480)}${details.description_raw.length > 480 ? "…" : ""}`}
          </p>
          {details.description_raw.length > 480 ? (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((value) => !value)}
              className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {descriptionExpanded ? "Show less" : "Read more"}
            </button>
          ) : null}
        </section>
      ) : null}

      {tags.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {screenshots.length ? <ScreenshotGallery screenshots={screenshots} /> : null}

      {trailers.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">RAWG trailers</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {trailers.slice(0, 2).map((trailer) => {
              const src = trailer.data.max ?? trailer.data[480];
              if (!src) return null;
              return <VideoPlayer key={trailer.id} src={src} poster={trailer.preview} title={trailer.name} />;
            })}
          </div>
        </section>
      ) : null}

      <YoutubeVideoGrid videos={youtube.slice(0, 3)} />

      {platformVideoLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat gameplay berdasarkan console...</p>
      ) : null}

      {platformVideoError && !platformVideoLoading ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">{platformVideoError}</p>
      ) : null}

      {platformVideos.length ? (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Gameplay by console</h2>
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">YouTube kategori</span>
          </div>
          <div className="space-y-6">
            {platformVideos.map((group) => (
              <div key={group.slug} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {group.name}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.videos.map((video) => (
                    <article
                      key={`${group.slug}-${video.videoId}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                    >
                      <iframe
                        title={`${video.title} - ${group.name}`}
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        className="h-56 w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
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
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stores.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Available on</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {stores.map((store) => (
              <li key={store}>{store}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <SimilarGamesRow games={similar.slice(0, 10)} />
    </div>
  );
}
