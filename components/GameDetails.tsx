import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Gamepad2,
  Globe,
  Layers,
  MessageCircle,
  Radio,
  Shield,
  Star,
  Store,
  Tag,
  Users,
} from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import ArtworkGallery from "@/components/ArtworkGallery";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import PlatformChips from "@/components/PlatformChips";
import { FeatureBadges } from "@/components/game/FeatureBadges";
import AgeRating from "@/components/AgeRating";
import { RawgAchievementsSection } from "@/components/game/RawgAchievementsSection";
import { ExpandableText } from "@/components/game/ExpandableText";
import { SystemRequirements } from "@/components/game/SystemRequirements";
import { VideoCarousel } from "@/components/video/VideoCarousel";
import ROMDownload from "@/components/ROMDownload";
import {
  type GameDetailsPayload,
  type GameParentPlatform,
  type GamePlatform,
  type GameRelatedGame,
  type GameScreenshot,
  type GameSimilarEntry,
} from "@/lib/gameData";
import { getBestCover } from "@/lib/getCoverArt";
import { igdbCoverUrl } from "@/lib/igdbImages";
import { normalizeImageUrl } from "@/lib/images";
import { getStoreIcon } from "@/lib/storeIcons";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/lib/platformIcons";
import type { IgdbVideo } from "@/lib/igdb";

export type GameReview = {
  id: number;
  text: string;
  rating: number | null;
  createdAt: string | null;
  author: string;
};

type GameStoreEntry = NonNullable<GameDetailsPayload["stores"]>[number];

interface GameDetailsProps {
  game: GameDetailsPayload;
  backLink: { href: string; label: string };
  screenshots: GameScreenshot[];
  reviews: GameReview[];
  videos: IgdbVideo[];
  similarGames: GameSimilarEntry[];
  additions: GameRelatedGame[];
  series: GameRelatedGame[];
}

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

const modeKeywordMap = new Map<string, string>([
  ["single-player", "Single-player"],
  ["singleplayer", "Single-player"],
  ["multiplayer", "Multiplayer"],
  ["coop", "Co-op"],
  ["co-op", "Co-op"],
  ["local-co-op", "Local Co-op"],
  ["local-multiplayer", "Local Multiplayer"],
  ["online", "Online"],
  ["pvp", "Online PvP"],
  ["split-screen", "Split-screen"],
]);

const playtimeLabelMap: Record<string, string> = {
  "less-than-hour": "< 1h",
  "less-than-an-hour": "< 1h",
  "0-1": "< 1h",
  "1-5": "1-5h",
  "5-20": "5-20h",
  "20-50": "20-50h",
  "50-100": "50-100h",
  "100-plus": "100h+",
};

const reactionEmojis: Record<string, string> = {
  recommended: "👍",
  exceptional: "🤩",
  meh: "😐",
  skip: "👎",
  wow: "🤯",
  love: "😍",
  rage: "🤬",
};

const additionLabelFallback = (slug?: string | null, name?: string | null) => {
  const source = (slug ?? name ?? "").toLowerCase();
  if (source.includes("dlc")) return "DLC";
  if (source.includes("expansion")) return "Expansion";
  return "Add-on";
};

type PlatformEntry = GamePlatform | GameParentPlatform | null | undefined;

type NormalizedPlatform = GamePlatform["platform"];

const normalizePlatformList = (entries: PlatformEntry[] = []): NormalizedPlatform[] => {
  const normalized = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      if ("platform" in entry && entry.platform) {
        return entry.platform;
      }
      return null;
    })
    .filter((platform): platform is NormalizedPlatform => {
      if (!platform || typeof platform.id !== "number") return false;
      const hasLabel =
        (typeof platform.name === "string" && platform.name.trim().length > 0) ||
        (typeof platform.slug === "string" && platform.slug.trim().length > 0);
      return hasLabel;
    });

  return normalized;
};

const formatReleaseDate = (value: string | null) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
};

const formatReviewDate = (value: string | null) => {
  if (!value) return "Date unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date unknown" : parsed.toLocaleDateString();
};

const metacriticColor = (score: number) => {
  if (score >= 75) return "bg-emerald-600/90";
  if (score >= 50) return "bg-amber-500/90";
  return "bg-rose-600/90";
};

const buildStoreUrl = (store: GameStoreEntry | undefined | null) => {
  if (!store) return null;
  return store.url ?? store.url_en ?? store.url_ru ?? (store.store?.domain ? `https://${store.store.domain}` : null);
};

const uniqueRelatedGames = (entries: GameRelatedGame[]) => {
  const map = new Map<number, GameRelatedGame>();
  entries.forEach((entry) => {
    if (entry && Number.isFinite(entry.id) && !map.has(entry.id)) {
      map.set(entry.id, entry);
    }
  });
  return Array.from(map.values());
};

const buildModeLabels = (tags: GameDetailsPayload["tags"] | null | undefined) => {
  const labels: string[] = [];
  const seen = new Set<string>();
  (tags ?? []).forEach((tag) => {
    const slug = tag.slug?.toLowerCase() ?? "";
    const name = tag.name?.toLowerCase() ?? "";
    modeKeywordMap.forEach((label, keyword) => {
      if ((slug && slug.includes(keyword)) || (name && name.includes(keyword))) {
        if (!seen.has(label)) {
          seen.add(label);
          labels.push(label);
        }
      }
    });
  });
  return labels;
};

const buildPlaytimeDistribution = (distribution: GameDetailsPayload["playtime_distribution"]) => {
  if (!distribution) return [] as Array<{ label: string; percent: number }>;
  const entries = Object.entries(distribution)
    .map(([key, value]) => ({
      label: playtimeLabelMap[key] ?? key.replace(/_/g, " "),
      value: typeof value === "number" ? value : 0,
    }))
    .filter((entry) => entry.value > 0);
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  if (!total) return [];
  return entries.map((entry) => ({ label: entry.label, percent: (entry.value / total) * 100 }));
};

export function GameDetails({ game, backLink, screenshots, reviews, videos, similarGames, additions, series }: GameDetailsProps) {
  const backTarget = backLink?.href?.startsWith("/") ? backLink.href : null;
  const buildInternalHref = (idOrSlug: number | string) => {
    const base = `/games/${idOrSlug}`;
    if (!backTarget) return base;
    return `${base}?returnTo=${encodeURIComponent(backTarget)}`;
  };
  const parentPlatforms = game.parent_platforms ?? [];
  const directPlatforms = game.platforms ?? [];
  const availablePlatformEntries = (directPlatforms.length ? directPlatforms : parentPlatforms) ?? [];
  const availablePlatforms = normalizePlatformList(availablePlatformEntries);
  const rawgIdentifier = game.rawgId ?? game.rawgSlug ?? game.slug ?? null;
  const genres = game.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
  const developers = game.developers?.map((developer) => developer.name).filter(Boolean) ?? [];
  const publishers = game.publishers?.map((publisher) => publisher.name).filter(Boolean) ?? [];
  const hasIgdbRating = typeof game.rating === "number" && Number.isFinite(game.rating);
  const ratingValue = hasIgdbRating ? game.rating! : null;
  const ratingLabel = ratingValue !== null ? ratingValue.toFixed(1) : "—";
  const ratingCountLabel =
    typeof game.ratings_count === "number" && Number.isFinite(game.ratings_count)
      ? game.ratings_count.toLocaleString()
      : "0";
  const bestCover = getBestCover(game);
  const igdbCoverImage = normalizeImageUrl(bestCover);
  const description = game.description_raw ?? game.description ?? "No description available.";
  const playtimeHours = typeof game.playtime === "number" && game.playtime > 0 ? Math.round(game.playtime) : null;
  const addedByStatusEntries = Object.entries(game.added_by_status ?? {})
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([key, value]) => ({ key, value }));
  const ratingBreakdown = (game.ratings ?? []).filter((rating) => rating.count > 0);
  const ageRatings = game.age_ratings ?? [];
  const modeLabels = buildModeLabels(game.tags);
  const displayTags = (game.tags ?? [])
    .map((tag) => tag.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 10);
  const additionEntries = uniqueRelatedGames([
    ...(game.additions ?? []),
    ...(game.expansions ?? []),
    ...(game.dlcs ?? []),
    ...additions,
  ]).slice(0, 8);
  const parentEntry: GameRelatedGame[] =
    game.parent_game && typeof game.parent_game.id === "number"
      ? [
          {
            id: game.parent_game.id,
            name: game.parent_game.name ?? "Parent game",
            slug: game.parent_game.slug ?? null,
            background_image: game.background_image ?? null,
            released: (game.parent_game as GameRelatedGame | undefined)?.released ?? null,
          },
        ]
      : [];
  const inlineSeries = Array.isArray(game.series)
    ? game.series
    : game.series && "results" in game.series && Array.isArray(game.series.results)
      ? game.series.results ?? []
      : [];
  const normalizedSeries = inlineSeries
    .filter((entry): entry is GameRelatedGame => Boolean(entry && typeof entry.id === "number" && entry.name))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      slug: entry.slug ?? null,
      background_image: entry.background_image ?? null,
      released: entry.released ?? null,
    }));
  const seriesEntries = uniqueRelatedGames([...parentEntry, ...normalizedSeries, ...series]).filter((entry) => entry.id !== game.id);
  const reactionEntries = Object.entries(game.reactions ?? {})
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const playtimeDistribution = buildPlaytimeDistribution(game.playtime_distribution);
  const coverUrl = igdbCoverUrl(game.cover?.image_id ?? null) ?? igdbCoverImage;

  const storeEntries = (game.stores ?? []).filter((store): store is GameStoreEntry => Boolean(buildStoreUrl(store)));

  const officialLinks: Array<{ label: string; href: string; description?: string }> = [];
  if (game.website) {
    officialLinks.push({ label: "Official website", href: game.website });
  }
  if (game.reddit_url) {
    officialLinks.push({
      label: game.reddit_name ? `${game.reddit_name} on Reddit` : "Reddit community",
      href: game.reddit_url,
      description: game.reddit_count ? `${game.reddit_count.toLocaleString()} members` : undefined,
    });
  }
  if (game.twitch_count) {
    officialLinks.push({
      label: "Twitch streams",
      href: `https://www.twitch.tv/directory/game/${encodeURIComponent(game.name)}`,
      description: `${game.twitch_count.toLocaleString()} streams on IGDB`,
    });
  }
  if (game.youtube_count) {
    officialLinks.push({
      label: "YouTube videos",
      href: `https://www.youtube.com/results?search_query=${encodeURIComponent(game.name)}`,
      description: `${game.youtube_count.toLocaleString()} clips indexed on IGDB`,
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href={backLink.href}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLink.label}
      </Link>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="relative h-72 w-full overflow-hidden">
          <CoverImage
            gameName={game.name}
            fallbackImage={igdbCoverImage}
            initialImage={igdbCoverImage}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>
        <div className="space-y-8 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-start">
              <div
                className="
                  w-full
                  max-w-[160px] sm:max-w-[200px]
                  aspect-[3/4]
                  rounded-2xl
                  overflow-hidden
                  mx-auto
                  bg-slate-900
                "
              >
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={`${game.name} cover`}
                    width={300}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No cover</div>
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{game.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Released: {formatReleaseDate(game.released ?? null)}</p>
                  {game.esrb_rating ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      ESRB: {game.esrb_rating.name}
                    </p>
                  ) : null}
                </div>
                {availablePlatforms.length ? (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Available on
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availablePlatforms.map((platform) => {
                        const label = platform.name ?? platform.slug ?? "Unknown platform";
                        const key = platform.slug ?? `${platform.id}`;
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-none"
                          >
                            <PlatformIcon platform={label} className="h-4 w-4" />
                            <span>{label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
                <FeatureBadges game={game} />
                {genres.length ? <p className="text-sm text-slate-600 dark:text-slate-300">Genres: {genres.join(", ")}</p> : null}
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                  {developers.length ? <span>Developed by {developers.join(", ")}</span> : null}
                  {publishers.length ? <span>Published by {publishers.join(", ")}</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 self-start rounded-2xl border border-amber-400/60 bg-amber-100 px-4 py-3 text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <Star className="h-5 w-5 fill-current" aria-hidden="true" />
                <div>
                  <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">{ratingLabel}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-100/80">{ratingCountLabel} ratings</p>
                </div>
              </div>
              {typeof game.metacritic === "number" ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Metacritic</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={cn("inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold text-white", metacriticColor(game.metacritic))}>
                      {game.metacritic}
                    </span>
                    {game.metacritic_platforms?.[0]?.platform?.name ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {game.metacritic_platforms[0].platform.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Description</h2>
        <ExpandableText text={description} />
      </section>

      {playtimeHours || addedByStatusEntries.length ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
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
          {playtimeDistribution.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Playtime distribution</p>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="flex h-full w-full">
                  {playtimeDistribution.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="h-full bg-emerald-500/80 text-[0px]"
                      style={{ width: `${bucket.percent}%` }}
                      title={`${bucket.label} – ${bucket.percent.toFixed(1)}%`}
                    >
                      &nbsp;
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                {playtimeDistribution.map((bucket) => (
                  <span key={bucket.label}>{bucket.label}</span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <SystemRequirements game={game} />

      {ratingBreakdown.length ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
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
                  <div className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400" style={{ width: `${Math.max(0, Math.min(rating.percent, 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Shield className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">Age Rating</h2>
        </div>
        <AgeRating ageRatings={ageRatings} />
      </section>

      {modeLabels.length ? (
        <section className="space-y-2 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
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
        <section className="space-y-2 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
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

      {storeEntries.length ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Store className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Store links</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {storeEntries.map((store) => {
              const href = buildStoreUrl(store);
              if (!href || !store.store?.name) return null;
              const Icon = store.store.slug ? getStoreIcon(store.store.slug) : null;
              return (
                <a
                  key={`${store.id}-${store.store.id}`}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-sm text-slate-800 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                >
                  {Icon ? <Icon className="h-4 w-4" /> : <Store className="h-4 w-4" aria-hidden="true" />}
                  <span>{store.store.name}</span>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {officialLinks.length ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Globe className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Official & community links</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {officialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400/70 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{link.label}</span>
                {link.description ? <span className="text-xs text-slate-500">{link.description}</span> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {reactionEntries.length ? (
        <section className="space-y-2 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Radio className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Player reactions</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-200">
            {reactionEntries.map(([key, value]) => (
              <span key={key} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/80">
                <span>{reactionEmojis[key] ?? "🎮"}</span>
                {value.toLocaleString()} {key}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {screenshots.length ? <ScreenshotGallery screenshots={screenshots} /> : null}

      {game.artworks?.length ? <ArtworkGallery artworks={game.artworks} /> : null}

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <VideoCarousel videos={videos} />
      </section>

      <RawgAchievementsSection rawgId={rawgIdentifier} gameTitle={game.name} />

      <ROMDownload game={game} />

      {additionEntries.length ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Gamepad2 className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Expansions & DLC</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionEntries.map((addition) => {
              const additionImage = normalizeImageUrl(addition.background_image ?? null);
              return (
                <Link
                  key={addition.id}
                  href={buildInternalHref(addition.id)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                  {additionImage ? (
                    <Image src={additionImage} alt={`${addition.name} cover`} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="320px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      No image
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
                    {additionLabelFallback(addition.slug, addition.name)}
                  </span>
                </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
                      {addition.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatReleaseDate(addition.released ?? null)}</p>
                    <PlatformChips platforms={addition.parent_platforms ?? []} limit={3} size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {seriesEntries.length ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Series overview</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seriesEntries.slice(0, 6).map((entry) => (
              <Link
                key={entry.id}
                href={buildInternalHref(entry.id)}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{formatReleaseDate(entry.released ?? null)}</p>
                <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
                  {entry.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {similarGames.length ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-widest">Similar games</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarGames.slice(0, 6).map((similar) => {
              const similarImage = normalizeImageUrl(similar.background_image ?? null);

              return (
                <Link
                  key={similar.id}
                  href={buildInternalHref(similar.id)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    {similarImage ? (
                      <Image
                        src={similarImage}
                        alt={`${similar.name} artwork`}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="320px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No image
                      </div>
                    )}
                    {typeof similar.rating === "number" && Number.isFinite(similar.rating) && similar.rating > 0 ? (
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
                    <PlatformChips
                      platforms={
                        (similar.parent_platforms?.length ? similar.parent_platforms : similar.platforms) ?? []
                      }
                      limit={3}
                      size="sm"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">Community reviews</h2>
        </div>
        {reviews.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/70">
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
          <p className="text-sm text-slate-500 dark:text-slate-400">No public IGDB reviews are available for this game yet.</p>
        )}
      </section>
    </div>
  );
}
