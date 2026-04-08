"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Star, Pencil, Trash2, Play, Filter, Heart, Loader2, Search } from "lucide-react";
import { Card } from "@/components/Card";
import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import type { GameDraft } from "@/hooks/useGameStore";
import { bestImageOriginal } from "@/lib/igdb";
import { igdbCoverUrl } from "@/lib/igdbImages";
import { Game, GameFormat, GameStatus, Device } from "@/lib/types";
import { cn, formatDateTime, parseTags, sortGames, cycleStatus } from "@/lib/utils";
import { truncateText } from "@/lib/text";

const statusFilters: Array<{ label: string; value: GameStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Backlog", value: "backlog" },
  { label: "Playing", value: "playing" },
  { label: "Completed", value: "completed" },
  { label: "Dropped", value: "dropped" },
];

const formatOptions: GameFormat[] = ["rom", "cartridge", "disc", "digital"];

const statusOptions: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

const sortOptions = [
  { label: "Title A-Z", value: "title-asc" },
  { label: "Title Z-A", value: "title-desc" },
  { label: "Last played", value: "last-played" },
  { label: "Rating high", value: "rating-desc" },
  { label: "Rating low", value: "rating-asc" },
];

type GameFormState = {
  title: string;
  platformId: string;
  platformName: string;
  region: string;
  status: GameStatus;
  format: GameFormat;
  source: string;
  fileName: string;
  folderPath: string;
  emulatorCore: string;
  shaderPreset: string;
  tags: string;
  rating: string;
  hoursPlayed: string;
  lastPlayedAt: string;
  notes: string;
  favorite: boolean;
  wishlist: boolean;
  igdbId: string;
  coverImage: string;
  heroImage: string;
  screenshotUrls: string;
};

const emptyFormState: GameFormState = {
  title: "",
  platformId: "",
  platformName: "",
  region: "",
  status: "backlog",
  format: "rom",
  source: "",
  fileName: "",
  folderPath: "",
  emulatorCore: "",
  shaderPreset: "",
  tags: "",
  rating: "",
  hoursPlayed: "",
  lastPlayedAt: "",
  notes: "",
  favorite: false,
  wishlist: false,
  igdbId: "",
  coverImage: "",
  heroImage: "",
  screenshotUrls: "",
};

function parseMediaList(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type IgdbSearchPlatform = {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string | null;
};

type IgdbSearchResult = {
  id: number;
  slug: string | null;
  name: string;
  summary: string;
  cover?: { image_id?: string | null } | null;
  coverImageId?: string | null;
  coverUrl: string | null;
  coverImageUrl?: string | null;
  screenshots: Array<{ image_id?: string | null }> | string[];
  screenshotUrls?: string[];
  first_release_date?: number | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number;
  platforms: IgdbSearchPlatform[];
  genres: string[];
  popularity: number | null;
};

type GameSearchResponse = {
  results: IgdbSearchResult[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type IgdbDetailMetadata = {
  id: number;
  name?: string;
  description?: string;
  summary?: string;
  thumbnail: string | null;
  backgroundImage: string | null;
  coverImageUrl?: string | null;
  screenshotUrls?: string[];
  gallery: Array<{ id: number; url: string | null }>;
  genres?: string[];
  platforms?: string[];
  rating?: number | null;
  ratingsCount?: number | null;
};

type PlatformOption = {
  id: number;
  name: string;
  slug: string;
  yearStart: number | null;
  image: string | null;
  abbreviation?: string | null;
};

const IGDB_MODAL_PAGE_SIZE = 6;

const getResultCover = (game: IgdbSearchResult | null | undefined): string | null => {
  if (!game) {
    return null;
  }

  const coverId =
    (game as { coverImageId?: string | null } | null)?.coverImageId ??
    (game as { cover?: { image_id?: string | null } } | null)?.cover?.image_id ??
    null;
  const igdbCover = igdbCoverUrl(coverId);
  if (igdbCover) {
    return igdbCover;
  }

  if (game.coverUrl) {
    return game.coverUrl;
  }
  if (game.coverImageUrl) {
    return game.coverImageUrl;
  }

  const screenshots = getResultScreenshots(game);
  return screenshots[0] ?? null;
};

const getResultScreenshots = (game: IgdbSearchResult | null | undefined): string[] => {
  if (!game) {
    return [];
  }

  const rawScreens = (game as { screenshots?: Array<{ image_id?: string | null }> } | null)?.screenshots;
  if (Array.isArray(rawScreens) && rawScreens.length) {
    const resolved = rawScreens
      .map((shot) => {
        if (typeof shot === "string") return shot;
        const id = shot?.image_id ?? null;
        return id ? bestImageOriginal(id) : null;
      })
      .filter((url): url is string => Boolean(url));
    if (resolved.length) {
      return resolved;
    }
  }

  if (Array.isArray(game.screenshotUrls) && game.screenshotUrls.length) {
    return game.screenshotUrls.filter((url): url is string => typeof url === "string");
  }

  return [];
};

type IgdbSortOption =
  | "none"
  | "most_popular"
  | "highest_rated"
  | "newest"
  | "oldest"
  | "alphabetical";

const mapIgdbSortToApiParam = (sort: IgdbSortOption): string => sort;

const IGDB_SORT_OPTIONS: Array<{ value: IgdbSortOption; label: string }> = [
  { value: "none", label: "No sort (default)" },
  { value: "most_popular", label: "Most popular" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "A → Z" },
];

function GameForm({
  value,
  onChange,
  devices,
}: {
  value: GameFormState;
  onChange: (value: GameFormState) => void;
  devices: Device[];
}) {
  const hasDevices = devices.length > 0;
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";
  const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <div className="space-y-4">
      {!hasDevices ? (
        <div className="rounded-xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Add devices first so you can associate games with a platform.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Title</label>
          <input
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            placeholder="The Legend of Zelda: Minish Cap"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Platform</label>
          <select
            value={value.platformId || "custom"}
            onChange={(event) => {
              const selected = event.target.value;
              if (selected === "custom") {
                onChange({ ...value, platformId: "" });
              } else {
                const device = devices.find((item) => item.id === selected);
                onChange({
                  ...value,
                  platformId: selected,
                  platformName: device ? device.name : value.platformName,
                });
              }
            }}
            className={fieldClass}
          >
            <option value="custom">Select device</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          <input
            value={value.platformName}
            onChange={(event) => onChange({ ...value, platformName: event.target.value })}
            placeholder="Custom platform name"
            className={`mt-2 ${fieldClass}`}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className={labelClass}>Status</label>
          <select
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as GameStatus })}
            className={fieldClass}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Format</label>
          <select
            value={value.format}
            onChange={(event) => onChange({ ...value, format: event.target.value as GameFormat })}
            className={fieldClass}
          >
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Region</label>
          <input
            value={value.region}
            onChange={(event) => onChange({ ...value, region: event.target.value })}
            placeholder="USA, EUR, JPN"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Tags</label>
          <input
            value={value.tags}
            onChange={(event) => onChange({ ...value, tags: event.target.value })}
            placeholder="rpg, backlog, gba"
            className={fieldClass}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Comma-separated list, e.g. RPG, co-op.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Rating</label>
            <input
              type="number"
              min={1}
              max={10}
              value={value.rating}
              onChange={(event) => onChange({ ...value, rating: event.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Hours played</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={value.hoursPlayed}
              onChange={(event) => onChange({ ...value, hoursPlayed: event.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Source</label>
          <input
            value={value.source}
            onChange={(event) => onChange({ ...value, source: event.target.value })}
            placeholder="ROM set, eShop, original"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>File name</label>
          <input
            value={value.fileName}
            onChange={(event) => onChange({ ...value, fileName: event.target.value })}
            placeholder="Pokemon - Fire Red (USA).gba"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Folder / Collection</label>
          <input
            value={value.folderPath}
            onChange={(event) => onChange({ ...value, folderPath: event.target.value })}
            placeholder="GBA/Completed"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Emulator core</label>
          <input
            value={value.emulatorCore}
            onChange={(event) => onChange({ ...value, emulatorCore: event.target.value })}
            placeholder="mgba"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Shader preset</label>
          <input
            value={value.shaderPreset}
            onChange={(event) => onChange({ ...value, shaderPreset: event.target.value })}
            placeholder="crt-guest-advanced-fast"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Last played</label>
          <input
            type="datetime-local"
            value={value.lastPlayedAt}
            onChange={(event) => onChange({ ...value, lastPlayedAt: event.target.value })}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Cover image URL</label>
          <input
            value={value.coverImage}
            onChange={(event) => onChange({ ...value, coverImage: event.target.value })}
            placeholder="https://.../cover.jpg"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Backdrop image URL</label>
          <input
            value={value.heroImage}
            onChange={(event) => onChange({ ...value, heroImage: event.target.value })}
            placeholder="https://.../background.jpg"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Screenshot URLs</label>
        <textarea
          value={value.screenshotUrls}
          onChange={(event) => onChange({ ...value, screenshotUrls: event.target.value })}
          rows={3}
          placeholder="https://.../shot-1.jpg\nhttps://.../shot-2.jpg"
          className={fieldClass}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Satu URL per baris.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>IGDB game ID</label>
          <input
            value={value.igdbId}
            onChange={(event) => onChange({ ...value, igdbId: event.target.value })}
            placeholder="3498"
            className={fieldClass}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Digunakan untuk mengambil metadata tambahan.</p>
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Notes</label>
        <textarea
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={4}
          placeholder="Thoughts, achievements, tweaks..."
          className={fieldClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={value.favorite}
          onChange={(event) => onChange({ ...value, favorite: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400"
        />
        Mark as favorite
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={value.wishlist}
          onChange={(event) => onChange({ ...value, wishlist: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400"
        />
        Add to wishlist
      </label>
    </div>
  );
}

type GameDetailApiResponse = {
  id: number;
  name?: string;
  description?: string;
  summary?: string;
  thumbnail: string | null;
  backgroundImage: string | null;
  coverImageUrl?: string | null;
  screenshotUrls?: string[];
  gallery: Array<{ id: number; url: string | null }>;
  genres?: string[];
  platforms?: string[];
  rating?: number | null;
  ratingsCount?: number | null;
  released?: string | null;
  website?: string | null;
  developers?: string[];
  publishers?: string[];
};

type RemoteMetadata = {
  thumbnail: string | null;
  heroImage: string | null;
  screenshots: string[];
};

function GameDetail({ game }: { game: Game }) {
  const { updateGame } = useGameStore();
  const [remoteMetadata, setRemoteMetadata] = useState<RemoteMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    setRemoteMetadata(null);
    setMetadataError(null);
  }, [game.id]);

  useEffect(() => {
    if (!game.igdbId) return;
    const needsCover = !game.coverImage;
    const needsHero = !game.heroImage;
    const needsScreenshots = !game.screenshotUrls || game.screenshotUrls.length === 0;

    if (!needsCover && !needsHero && !needsScreenshots) {
      return;
    }

    let cancelled = false;
    setLoadingMetadata(true);
    setMetadataError(null);

    fetch(`/api/games/${game.igdbId}`)
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const message = data?.error ?? "Gagal memuat metadata IGDB.";
          throw new Error(message);
        }
        return (await response.json()) as GameDetailApiResponse;
      })
      .then((data) => {
        if (cancelled) return;
        const screenshots = data.screenshotUrls?.length
          ? data.screenshotUrls
          : (data.gallery ?? [])
              .map((shot) => shot?.url?.trim())
              .filter((url): url is string => Boolean(url));

        const metadata: RemoteMetadata = {
          thumbnail: data.thumbnail ?? data.coverImageUrl ?? null,
          heroImage: data.backgroundImage ?? data.thumbnail ?? data.coverImageUrl ?? null,
          screenshots,
        };
        setRemoteMetadata(metadata);

        const updates: Partial<Game> = {};
        if (!game.igdbId) {
          updates.igdbId = data.id;
        }
        if (metadata.thumbnail && !game.coverImage) {
          updates.coverImage = metadata.thumbnail;
        }
        if (metadata.heroImage && !game.heroImage) {
          updates.heroImage = metadata.heroImage;
        }
        if (metadata.screenshots.length && (!game.screenshotUrls || game.screenshotUrls.length === 0)) {
          updates.screenshotUrls = metadata.screenshots;
        }

        if (Object.keys(updates).length > 0) {
          updateGame(game.id, updates);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setMetadataError(error instanceof Error ? error.message : "Tidak dapat memuat metadata tambahan.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMetadata(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [game.id, game.igdbId, game.coverImage, game.heroImage, game.screenshotUrls, updateGame]);

  const thumbnailImage = remoteMetadata?.thumbnail ?? game.coverImage ?? null;
  const heroImage = remoteMetadata?.heroImage ?? game.heroImage ?? null;
  const screenshots = remoteMetadata?.screenshots?.length
    ? remoteMetadata.screenshots
    : game.screenshotUrls ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{game.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{game.platformName}</p>
      </div>
      {heroImage ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <img src={heroImage} alt={`${game.title} hero art`} className="h-36 w-full object-cover" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={game.status} />
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs uppercase text-slate-700 dark:border-slate-700 dark:text-slate-300">{game.format}</span>
        {game.region ? (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Region: {game.region}
          </span>
        ) : null}
        {game.favorite ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            ★ Favorite
          </span>
        ) : null}
        {game.wishlist ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
            <Heart className="h-3 w-3 fill-current" /> Wishlist
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-4">
        {thumbnailImage ? (
          <div className="h-28 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <img src={thumbnailImage} alt={`${game.title} cover art`} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <p>
            <span className="text-slate-500 dark:text-slate-500">Source:</span> {game.source || "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">File:</span> {game.fileName || "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Folder:</span> {game.folderPath || "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Emulator core:</span> {game.emulatorCore || "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Shader:</span> {game.shaderPreset || "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Rating:</span> {game.rating ?? "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Hours:</span> {game.hoursPlayed ?? "—"}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Last played:</span> {formatDateTime(game.lastPlayedAt)}
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-500">Created:</span> {formatDateTime(game.createdAt)}
          </p>
          {game.igdbId ? (
            <p>
              <span className="text-slate-500 dark:text-slate-500">IGDB ID:</span> {game.igdbId}
            </p>
          ) : null}
        </div>
      </div>
      {loadingMetadata ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Memuat metadata tambahan dari IGDB...
        </div>
      ) : null}
      {metadataError ? (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {metadataError}
        </p>
      ) : null}
      {game.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {game.tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      ) : null}
      {screenshots.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Screenshots</h4>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {screenshots.map((shot) => (
              <div
                key={shot}
                className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <img src={shot} alt={`${game.title} screenshot`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      ) : !loadingMetadata ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada screenshot untuk game ini.</p>
      ) : null}
      {game.notes ? (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{game.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function GamesPage() {
  const { devices } = useDeviceStore();
  const {
    games,
    addGame,
    updateGame,
    deleteGame,
    toggleFavoriteGame,
    toggleWishlistGame,
    setStatus,
    markPlayed,
    filters,
    setPlatformTerm,
    setStatusFilter,
    setPlatformFilter,
    setFormatFilter,
    toggleFavoritesOnly,
    toggleWishlistOnly,
    setSortOrder,
    draftGame,
    clearDraftGame,
  } = useGameStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formState, setFormState] = useState<GameFormState>(emptyFormState);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [igdbQuery, setIgdbQuery] = useState("");
  const [igdbPlatform, setGamePlatform] = useState("all");
  const [igdbCommittedQuery, setIgdbCommittedQuery] = useState("");
  const [igdbCommittedPlatform, setIgdbCommittedPlatform] = useState("all");
  const [igdbPage, setIgdbPage] = useState(1);
  const [igdbResults, setIgdbResults] = useState<IgdbSearchResult[]>([]);
  const [igdbPagination, setIgdbPagination] = useState({
    total: 0,
    page: 1,
    pageSize: IGDB_MODAL_PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [igdbHasSearched, setIgdbHasSearched] = useState(false);
  const [igdbLoading, setIgdbLoading] = useState(false);
  const [igdbError, setIgdbError] = useState<string | null>(null);
  const [igdbSelectionLoadingId, setIgdbSelectionLoadingId] = useState<number | null>(null);
  const [igdbPlatforms, setGamePlatforms] = useState<PlatformOption[]>([]);
  const [igdbPlatformLoading, setGamePlatformLoading] = useState(false);
  const [igdbPlatformError, setGamePlatformError] = useState<string | null>(null);
  const [igdbPlatformSearch, setGamePlatformSearch] = useState("");
  const [igdbPlatformsFetched, setGamePlatformsFetched] = useState(false);
  const [igdbSortOrder, setIgdbSortOrder] = useState<IgdbSortOption>("none");
  const [igdbPageInput, setIgdbPageInput] = useState("1");

  useEffect(() => {
    if (draftGame) {
      setEditingGame(null);
      setFormState({
        ...emptyFormState,
        ...convertDraftToForm(draftGame),
      });
      setIsModalOpen(true);
      clearDraftGame();
    }
  }, [draftGame, clearDraftGame]);

  useEffect(() => {
    if (!isModalOpen || igdbPlatformsFetched) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setGamePlatformLoading(true);
    setGamePlatformError(null);

    fetch("/api/igdb/platforms", { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;
        if (!response.ok) {
          const message = (payload as { error?: string } | null)?.error ?? "Unable to load platform list.";
          throw new Error(message);
        }
        return payload;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        type ApiPlatform = {
          id: number;
          name: string;
          slug?: string | null;
          generation?: number | null;
          abbreviation?: string | null;
        };
        const data = Array.isArray((payload as { platforms?: ApiPlatform[] } | null)?.platforms)
          ? ((payload as { platforms: ApiPlatform[] }).platforms ?? [])
          : Array.isArray(payload)
            ? (payload as ApiPlatform[])
            : [];
        const normalized = data.map((platform) => ({
          id: platform.id,
          name: platform.name,
          slug: platform.slug ?? `igdb-${platform.id}`,
          yearStart: typeof platform.generation === "number" ? platform.generation : null,
          image: null,
          abbreviation: platform.abbreviation ?? null,
        }));
        const sorted = [...normalized].sort((a, b) => a.name.localeCompare(b.name));
        setGamePlatforms(sorted);
        setGamePlatformsFetched(true);
      })
      .catch((error) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        console.error(error);
        setGamePlatformError(error instanceof Error ? error.message : "Unable to load platform list.");
        setGamePlatformsFetched(true);
      })
      .finally(() => {
        if (!cancelled) {
          setGamePlatformLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      setGamePlatformLoading(false);
    };
  }, [isModalOpen, igdbPlatformsFetched]);

  useEffect(() => {
    if (!isModalOpen || !igdbHasSearched) {
      return;
    }

    const controller = new AbortController();
    setIgdbLoading(true);
    setIgdbError(null);

    fetch(`/api/games/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: igdbCommittedQuery,
        sort: mapIgdbSortToApiParam(igdbSortOrder),
        platform: igdbCommittedPlatform,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;
        return payload;
      })
      .then((payload) => {
        const data = payload as Partial<GameSearchResponse> | null;
        const normalizedResults = Array.isArray(data?.results)
          ? (data.results as IgdbSearchResult[])
          : Array.isArray((data as any)?.games)
            ? ((data as any).games as IgdbSearchResult[])
            : [];
        const mappedResults = normalizedResults.map((result) => {
          const coverId =
            (result as { coverImageId?: string | null } | null)?.coverImageId ??
            (result as { cover?: { image_id?: string | null } } | null)?.cover?.image_id ??
            null;
          const coverUrl = getResultCover(result);
          const screenshots = getResultScreenshots(result);
          const releaseTimestamp =
            typeof result.first_release_date === "number"
              ? result.first_release_date
              : (result as { first_release_date?: number | null } | null)?.first_release_date ?? null;

          const releaseYear = typeof result.releaseYear === "number"
            ? result.releaseYear
            : releaseTimestamp != null
              ? new Date(Number(releaseTimestamp) * 1000).getFullYear()
              : null;
          const rating =
            typeof result.rating === "number"
              ? result.rating
              : (result as { total_rating?: number | null } | null)?.total_rating ?? null;
          const ratingsCount =
            typeof result.ratingsCount === "number"
              ? result.ratingsCount
              : (result as { total_rating_count?: number | null } | null)?.total_rating_count ?? null;

          return {
            ...result,
            cover: (result as { cover?: { image_id?: string | null } } | null)?.cover ?? (coverId ? { image_id: coverId } : null),
            coverImageId: coverId,
            coverUrl,
            coverImageUrl: coverUrl ?? result.coverImageUrl ?? null,
            screenshots: Array.isArray(result.screenshots) ? result.screenshots : [],
            screenshotUrls: screenshots,
            releaseYear,
            rating,
            ratingsCount: ratingsCount ?? 0,
          } satisfies IgdbSearchResult;
        });
        if ((data as { error?: string } | null)?.error) {
          setIgdbError((data as { error?: string }).error ?? null);
        }
        setIgdbResults(mappedResults);
        const totalResults = normalizedResults.length;
        const totalPages = Math.max(1, Math.ceil(totalResults / IGDB_MODAL_PAGE_SIZE));
        const nextPagination = {
          total: totalResults,
          page: 1,
          pageSize: IGDB_MODAL_PAGE_SIZE,
          hasNextPage: totalPages > 1,
          hasPreviousPage: false,
        };
        setIgdbPagination(nextPagination);
        setIgdbPage(1);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        console.error(error);
        setIgdbError(error instanceof Error ? error.message : "Unexpected IGDB error.");
        setIgdbResults([]);
        setIgdbPagination({
          total: 0,
          page: 1,
          pageSize: IGDB_MODAL_PAGE_SIZE,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      })
      .finally(() => {
        setIgdbLoading(false);
      });

    return () => controller.abort();
  }, [isModalOpen, igdbHasSearched, igdbCommittedQuery, igdbCommittedPlatform, igdbSortOrder]);

  useEffect(() => {
    setIgdbPage(1);
  }, [igdbSortOrder]);

  const filteredGames = useMemo(() => {
    let result = [...games];
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      result = result.filter((game) =>
        `${game.title} ${game.tags.join(" ")}`.toLowerCase().includes(query),
      );
    }
    if (filters.platformTerm) {
      const platformQuery = filters.platformTerm.toLowerCase();
      result = result.filter((game) => game.platformName.toLowerCase().includes(platformQuery));
    }
    if (filters.status !== "all") {
      result = result.filter((game) => game.status === filters.status);
    }
    if (filters.platformId !== "all") {
      result = result.filter((game) => game.platformId === filters.platformId);
    }
    if (filters.format !== "all") {
      result = result.filter((game) => game.format === filters.format);
    }
    if (filters.favoritesOnly) {
      result = result.filter((game) => game.favorite);
    }
    if (filters.wishlistOnly) {
      result = result.filter((game) => game.wishlist);
    }
    return sortGames(result, filters.sortOrder);
  }, [games, filters]);

  const currentGame = selectedGameId ? games.find((game) => game.id === selectedGameId) ?? null : null;

  const filteredGamePlatforms = useMemo(() => {
    if (!igdbPlatformSearch.trim()) {
      return igdbPlatforms;
    }
    const term = igdbPlatformSearch.trim().toLowerCase();
    return igdbPlatforms.filter((platform) => platform.name.toLowerCase().includes(term));
  }, [igdbPlatformSearch, igdbPlatforms]);

  const resetIgdbSearch = () => {
    setIgdbQuery("");
    setGamePlatform("all");
    setGamePlatformSearch("");
    setIgdbCommittedQuery("");
    setIgdbCommittedPlatform("all");
    setIgdbPage(1);
    setIgdbResults([]);
    setIgdbPagination({
      total: 0,
      page: 1,
      pageSize: IGDB_MODAL_PAGE_SIZE,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    setIgdbHasSearched(false);
    setIgdbLoading(false);
    setIgdbError(null);
    setIgdbSelectionLoadingId(null);
  };

  const retryPlatformLoad = () => {
    if (igdbPlatformLoading) {
      return;
    }
    setGamePlatformError(null);
    setGamePlatformsFetched(false);
  };

  const openAddModal = () => {
    setEditingGame(null);
    setFormState(emptyFormState);
    resetIgdbSearch();
    setIsModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormState(convertGameToForm(game));
    resetIgdbSearch();
    if (game.igdbId) {
      setIgdbQuery(game.title);
      setIgdbCommittedQuery("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formState.title.trim()) return;
    const device = devices.find((item) => item.id === formState.platformId);
    const tags = parseTags(formState.tags);
    const rating = formState.rating ? Number(formState.rating) : undefined;
    const hours = formState.hoursPlayed ? Number(formState.hoursPlayed) : undefined;
    const igdbIdNumber = Number(formState.igdbId);
    const igdbId = formState.igdbId && Number.isFinite(igdbIdNumber) ? igdbIdNumber : undefined;
    const coverImage = formState.coverImage.trim() ? formState.coverImage.trim() : undefined;
    const heroImage = formState.heroImage.trim() ? formState.heroImage.trim() : undefined;
    const screenshotUrls = parseMediaList(formState.screenshotUrls);
    const newGameData: Omit<Game, "id" | "createdAt"> = {
      title: formState.title,
      platformId: formState.platformId || formState.platformName || "custom",
      platformName: device ? device.name : formState.platformName || "Unknown",
      igdbId,
      region: formState.region || undefined,
      status: formState.status,
      format: formState.format,
      source: formState.source || undefined,
      fileName: formState.fileName || undefined,
      folderPath: formState.folderPath || undefined,
      emulatorCore: formState.emulatorCore || undefined,
      shaderPreset: formState.shaderPreset || undefined,
      tags,
      rating,
      hoursPlayed: hours,
      lastPlayedAt: formState.lastPlayedAt || undefined,
      notes: formState.notes || undefined,
      favorite: formState.favorite,
      wishlist: formState.wishlist,
      coverImage,
      heroImage,
      screenshotUrls: screenshotUrls.length ? screenshotUrls : undefined,
    };

    if (editingGame) {
      updateGame(editingGame.id, newGameData);
    } else {
      addGame(newGameData);
    }
    setIsModalOpen(false);
    setEditingGame(null);
    setFormState(emptyFormState);
  };

  const handleDelete = (game: Game) => {
    if (window.confirm(`Delete ${game.title}?`)) {
      deleteGame(game.id);
    }
  };

  const handleIgdbSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!igdbQuery.trim() && igdbPlatform === "all") {
      setIgdbError("Masukkan judul game atau pilih console untuk mencari di IGDB.");
      setIgdbHasSearched(false);
      setIgdbResults([]);
      setIgdbPagination({
        total: 0,
        page: 1,
        pageSize: IGDB_MODAL_PAGE_SIZE,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      return;
    }

    setIgdbPage(1);
    setIgdbCommittedQuery(igdbQuery.trim());
    setIgdbCommittedPlatform(igdbPlatform);
    setIgdbHasSearched(true);
  };

  const handleIgdbPageChange = (direction: "previous" | "next") => {
    setIgdbPage((prev) => {
      if (direction === "previous") {
        return Math.max(1, prev - 1);
      }
      return Math.min(prev + 1, igdbTotalPages);
    });
  };

  const fetchIgdbDetailMetadata = async (id: number): Promise<IgdbDetailMetadata> => {
    const response = await fetch(`/api/games/${id}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const message = (payload as { error?: string } | null)?.error ?? "Tidak dapat memuat metadata IGDB.";
      throw new Error(message);
    }
    return payload as IgdbDetailMetadata;
  };

  const handleApplyIgdbResult = async (result: IgdbSearchResult) => {
    setIgdbSelectionLoadingId(result.id);
    setIgdbError(null);
    try {
      const detail = await fetchIgdbDetailMetadata(result.id);
      const screenshotList = detail.screenshotUrls?.length
        ? detail.screenshotUrls
        : (detail.gallery ?? [])
            .map((shot) => shot?.url?.trim())
            .filter((url): url is string => Boolean(url));
      const fallbackScreens = getResultScreenshots(result);
      const resolvedScreenshots = screenshotList.length ? screenshotList : fallbackScreens;
      const coverFromSearch = getResultCover(result);

      const tagSet = new Set<string>();
      detail.genres?.forEach((genre) => {
        if (genre) tagSet.add(genre);
      });
      detail.platforms?.forEach((platform) => {
        if (platform) tagSet.add(platform);
      });
      result.platforms.forEach((platform) => {
        if (platform.name) {
          tagSet.add(platform.name);
        }
      });

      const ratingString =
        typeof detail.rating === "number" && !Number.isNaN(detail.rating)
          ? detail.rating.toFixed(1).replace(/\.0$/, "")
          : "";

      const primaryPlatformName = detail.platforms?.[0] ?? result.platforms[0]?.name ?? formState.platformName;
      const matchedDevice = primaryPlatformName
        ? devices.find((device) => device.name.toLowerCase() === primaryPlatformName.toLowerCase())
        : undefined;
      const nextNotes = formState.notes.trim()
        ? formState.notes
        : detail.description
            ? truncateText(detail.description, 480)
            : "";

      setFormState((prev) => {
        const nextTags = Array.from(tagSet).join(", ");
        const nextCover = detail.thumbnail ?? detail.coverImageUrl ?? coverFromSearch ?? prev.coverImage ?? "";
        const nextHero =
          detail.backgroundImage ??
          detail.thumbnail ??
          detail.coverImageUrl ??
          coverFromSearch ??
          prev.heroImage ??
          "";
        const nextScreenshots = resolvedScreenshots.length ? resolvedScreenshots.join("\n") : prev.screenshotUrls;
        const nextFolder = prev.folderPath || result.platforms[0]?.slug || "";
        const nextFormat = editingGame ? prev.format : "digital";
        const nextSource = prev.source || "IGDB";
        const nextNotesValue = nextNotes || prev.notes;
        return {
          ...prev,
          title: detail.name ?? result.name,
          platformId: matchedDevice ? matchedDevice.id : prev.platformId,
          platformName: matchedDevice ? matchedDevice.name : primaryPlatformName ?? prev.platformName,
          source: nextSource,
          status: prev.status || "backlog",
          format: nextFormat,
          fileName: prev.fileName || result.name,
          folderPath: nextFolder,
          tags: nextTags,
          rating: ratingString || prev.rating,
          igdbId: String(detail.id ?? result.id),
          coverImage: nextCover,
          heroImage: nextHero,
          screenshotUrls: nextScreenshots,
          notes: nextNotesValue,
        };
      });
    } catch (error) {
      console.error(error);
      setIgdbError(error instanceof Error ? error.message : "Tidak dapat menerapkan metadata IGDB.");
    } finally {
      setIgdbSelectionLoadingId(null);
    }
  };

  const safeIgdbResults = Array.isArray(igdbResults) ? igdbResults : [];
  const igdbPageSizeValue = IGDB_MODAL_PAGE_SIZE;
  const igdbTotalPages = Math.max(1, Math.ceil(safeIgdbResults.length / igdbPageSizeValue));
  const igdbCurrentPage = Math.min(Math.max(igdbPage, 1), igdbTotalPages);
  const igdbPaginatedResults = safeIgdbResults.slice(
    (igdbCurrentPage - 1) * igdbPageSizeValue,
    igdbCurrentPage * igdbPageSizeValue,
  );
  const igdbCanGoPrevious = igdbCurrentPage > 1;
  const igdbCanGoNext = igdbCurrentPage < igdbTotalPages;

  useEffect(() => {
    setIgdbPagination({
      total: safeIgdbResults.length,
      page: igdbCurrentPage,
      pageSize: igdbPageSizeValue,
      hasNextPage: igdbCanGoNext,
      hasPreviousPage: igdbCanGoPrevious,
    });
  }, [igdbCanGoNext, igdbCanGoPrevious, igdbCurrentPage, igdbPageSizeValue, safeIgdbResults.length]);

  useEffect(() => {
    setIgdbPageInput(String(igdbCurrentPage));
  }, [igdbCurrentPage]);

  const handleIgdbPageJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!igdbPageInput) {
      setIgdbPageInput(String(igdbCurrentPage));
      return;
    }
    const parsed = Number.parseInt(igdbPageInput, 10);
    if (!Number.isFinite(parsed)) {
      setIgdbPageInput(String(igdbCurrentPage));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), igdbTotalPages);
    setIgdbPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel neon-outline flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">Games library</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Cari game lebih cepat: filter status, platform, format, dan favorit dalam sekali lihat.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-cyan-500/60 dark:bg-cyan-500/30 dark:text-cyan-100 dark:hover:text-cyan-50 dark:focus-visible:ring-offset-slate-900"
        >
          <Plus className="h-4 w-4" /> Add game
        </button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
                  filters.status === filter.value
                    ? "border-cyan-500/50 bg-cyan-500/25 text-cyan-700 dark:text-cyan-200"
                    : "border-white/40 bg-white/45 text-slate-600 hover:bg-cyan-500/10 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-300",
                )}
              >
                {filter.label}
              </button>
            ))}
            </div>
            <div className="rounded-lg border border-white/40 bg-white/50 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300">
              {filteredGames.length} game ditemukan
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Filter className="h-3.5 w-3.5" /> Platform
              </span>
              <select
                value={filters.platformId}
                onChange={(event) => setPlatformFilter(event.target.value)}
                className="rounded-xl border border-white/50 bg-white/65 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur focus:border-cyan-500 focus:ring-cyan-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                <option value="all">All platforms</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Format</span>
              <select
                value={filters.format}
                onChange={(event) => setFormatFilter(event.target.value as GameFormat | "all")}
                className="rounded-xl border border-white/50 bg-white/65 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur focus:border-cyan-500 focus:ring-cyan-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                <option value="all">All formats</option>
                {formatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sort by</span>
              <select
                value={filters.sortOrder}
                onChange={(event) => setSortOrder(event.target.value as typeof filters.sortOrder)}
                className="rounded-xl border border-white/50 bg-white/65 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur focus:border-cyan-500 focus:ring-cyan-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Console search</span>
              <input
                value={filters.platformTerm}
                onChange={(event) => setPlatformTerm(event.target.value)}
                placeholder="Search by console name..."
                className="rounded-xl border border-white/50 bg-white/65 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur focus:border-cyan-500 focus:ring-cyan-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleFavoritesOnly}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                filters.favoritesOnly
                  ? "border-amber-400/70 bg-amber-100/90 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200"
                  : "border-white/50 bg-white/60 text-slate-600 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300",
              )}
              aria-pressed={filters.favoritesOnly}
            >
              Favorites only
            </button>
            <button
              type="button"
              onClick={toggleWishlistOnly}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                filters.wishlistOnly
                  ? "border-sky-400/70 bg-sky-100/90 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/20 dark:text-sky-200"
                  : "border-white/50 bg-white/60 text-slate-600 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300",
              )}
              aria-pressed={filters.wishlistOnly}
            >
              Wishlist only
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/45 bg-white/45 shadow-sm shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800" aria-label="Games list">
            <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Platform</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Format</th>
                <th scope="col" className="px-4 py-3">Tags</th>
                <th scope="col" className="px-4 py-3">Rating</th>
                <th scope="col" className="px-4 py-3">Last played</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    No games match the current filters.
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => (
                  <tr
                    key={game.id}
                    className="cursor-pointer transition-colors hover:bg-emerald-500/5 dark:hover:bg-slate-900/60"
                    onClick={() => setSelectedGameId(game.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavoriteGame(game.id);
                          }}
                          className={cn(
                            "rounded-full p-1 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                            game.favorite
                              ? "text-amber-500 dark:text-amber-400"
                              : "text-slate-400 hover:-translate-y-0.5 hover:text-amber-400",
                          )}
                          aria-label={game.favorite ? "Remove favorite" : "Mark as favorite"}
                          aria-pressed={game.favorite ?? false}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleWishlistGame(game.id);
                          }}
                          className={cn(
                            "rounded-full p-1 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                            game.wishlist
                              ? "text-sky-500 dark:text-sky-300"
                              : "text-slate-400 hover:-translate-y-0.5 hover:text-sky-400",
                          )}
                          aria-label={game.wishlist ? "Remove from wishlist" : "Add to wishlist"}
                          aria-pressed={game.wishlist ?? false}
                        >
                          <Heart className={cn("h-4 w-4", game.wishlist ? "fill-current" : "")} />
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Added {formatDateTime(game.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{game.platformName}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setStatus(game.id, cycleStatus(game.status));
                        }}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900"
                        aria-label={`Cycle status for ${game.title}`}
                      >
                        <StatusBadge status={game.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{game.format}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {game.tags.slice(0, 3).map((tag) => (
                          <TagPill key={tag} label={tag} />
                        ))}
                        {game.tags.length > 3 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">+{game.tags.length - 3} more</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{game.rating ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDateTime(game.lastPlayedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markPlayed(game.id);
                          }}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/90 p-2 text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
                          aria-label="Play now"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(game);
                          }}
                          className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
                          aria-label="Edit game"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(game);
                          }}
                          className="rounded-xl border border-rose-400/60 bg-rose-500/10 p-2 text-rose-500 transition-transform duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:text-rose-100 dark:focus-visible:ring-offset-slate-900"
                          aria-label="Delete game"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

      </Card>

      <Modal
        title={editingGame ? "Edit game" : "Add game"}
        description="Organise games with metadata and notes."
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          clearDraftGame();
          resetIgdbSearch();
        }}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                clearDraftGame();
                resetIgdbSearch();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
            >
              {editingGame ? "Save changes" : "Add game"}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cari metadata IGDB</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Temukan game di IGDB untuk mengisi otomatis judul, platform, cover art, dan screenshot sebelum menyimpan.
              </p>
            </div>
            <form
              onSubmit={handleIgdbSearchSubmit}
              className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto]"
            >
              <div className="relative min-w-0">
                <label htmlFor="library-igdb-query" className="sr-only">
                  Cari game di IGDB
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="library-igdb-query"
                  value={igdbQuery}
                  onChange={(event) => {
                    setIgdbQuery(event.target.value);
                    if (igdbError) setIgdbError(null);
                  }}
                  placeholder="Cari judul game (contoh: Shenmue)"
                  className="w-full rounded-xl border border-slate-200 bg-white/95 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="library-igdb-platform"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  Console / platform
                </label>
                <select
                  id="library-igdb-platform"
                  value={igdbPlatform}
                  onChange={(event) => setGamePlatform(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  aria-busy={igdbPlatformLoading}
                >
                  <option value="all">Semua platform</option>
                  {filteredGamePlatforms.length ? (
                    filteredGamePlatforms.map((platform) => (
                      <option key={platform.id} value={String(platform.id)}>
                        {platform.name}
                      </option>
                    ))
                  ) : (
                    <option value="empty" disabled>
                      {igdbPlatformLoading ? "Memuat daftar platform..." : "Platform tidak ditemukan"}
                    </option>
                  )}
                </select>
                {igdbPlatformLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Memuat daftar platform terbaru...</p>
                ) : null}
                <input
                  id="library-igdb-platform-filter"
                  type="search"
                  value={igdbPlatformSearch}
                  onChange={(event) => setGamePlatformSearch(event.target.value)}
                  placeholder="Filter nama console"
                  className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="library-igdb-sort"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  Urutkan hasil
                </label>
                <select
                  id="library-igdb-sort"
                  value={igdbSortOrder}
                  onChange={(event) => setIgdbSortOrder(event.target.value as IgdbSortOption)}
                  className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  {IGDB_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
              >
                <Search className="mr-2 h-4 w-4" aria-hidden="true" /> Cari
              </button>
            </form>
            {igdbPlatformError ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
                <span>{igdbPlatformError}</span>
                <button
                  type="button"
                  onClick={retryPlatformLoad}
                  className="rounded-lg border border-rose-500/40 px-2 py-1 font-medium text-rose-600 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-500/50 dark:text-rose-200 dark:hover:text-rose-100 dark:focus-visible:ring-offset-slate-900"
                >
                  Coba lagi
                </button>
              </div>
            ) : null}
            {igdbError ? (
              <p className="text-xs text-rose-600 dark:text-rose-300">{igdbError}</p>
            ) : null}
            {igdbLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Mengambil hasil dari IGDB...
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {igdbPaginatedResults.map((game) => {
                const isApplying = igdbSelectionLoadingId === game.id;
                const coverImageId = game.coverImageId ?? game.cover?.image_id ?? null;
                const coverUrl = getResultCover(game);
                const cardData: CompactGameCardData = {
                  id: game.id,
                  name: game.name,
                  coverImageId,
                  coverUrl,
                  rating: game.rating,
                  ratingsCount: game.ratingsCount,
                  releaseYear: game.releaseYear,
                  platforms: game.platforms?.map((platform) => ({
                    id: platform.id,
                    name: platform.name,
                    abbreviation: platform.abbreviation ?? null,
                  })),
                };

                return (
                  <GameCardCompact
                    key={game.id}
                    game={cardData}
                    actionLabel={isApplying ? "Menerapkan..." : "Gunakan metadata"}
                    onAction={() => handleApplyIgdbResult(game)}
                    actionDisabled={isApplying}
                    actionBusy={isApplying}
                  />
                );
              })}
            </div>
            {igdbHasSearched && !igdbLoading && safeIgdbResults.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada hasil untuk pencarian ini. Coba judul lain atau pilih console yang berbeda.
              </p>
            ) : null}
            {igdbHasSearched && (safeIgdbResults.length > igdbPageSizeValue || igdbCanGoNext || igdbCanGoPrevious) ? (
              <nav
                aria-label="Paginasi pencarian IGDB"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <span>
                  Halaman {igdbCurrentPage} dari {igdbTotalPages}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <form onSubmit={handleIgdbPageJumpSubmit} className="flex items-center gap-2">
                    <label htmlFor="igdb-page-input" className="font-semibold text-slate-600 dark:text-slate-200">
                      Lompat ke
                    </label>
                    <input
                      id="igdb-page-input"
                      type="number"
                      min={1}
                      max={igdbTotalPages}
                      value={igdbPageInput}
                      onChange={(event) => setIgdbPageInput(event.target.value)}
                      className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-400 px-3 py-1.5 font-semibold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-500/70 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                    >
                      Pergi
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleIgdbPageChange("previous")}
                      disabled={!igdbCanGoPrevious}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-semibold transition ${
                        !igdbCanGoPrevious
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
                          : "border-slate-300 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIgdbPageChange("next")}
                      disabled={!igdbCanGoNext}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-semibold transition ${
                        !igdbCanGoNext
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500"
                          : "border-emerald-500/40 bg-emerald-500/90 text-white hover:-translate-y-0.5 hover:border-emerald-400 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </nav>
            ) : null}
          </section>
          <GameForm value={formState} onChange={setFormState} devices={devices} />
        </div>
      </Modal>

      <Modal
        title="Game details"
        description="Deep dive into the metadata for this game."
        open={Boolean(currentGame)}
        onClose={() => setSelectedGameId(null)}
        size="lg"
      >
        {currentGame ? <GameDetail game={currentGame} /> : null}
      </Modal>
    </div>
  );
}

function convertGameToForm(game: Game): GameFormState {
  return {
    title: game.title,
    platformId: game.platformId,
    platformName: game.platformName,
    region: game.region ?? "",
    status: game.status,
    format: game.format,
    source: game.source ?? "",
    fileName: game.fileName ?? "",
    folderPath: game.folderPath ?? "",
    emulatorCore: game.emulatorCore ?? "",
    shaderPreset: game.shaderPreset ?? "",
    tags: game.tags.join(", "),
    rating: game.rating?.toString() ?? "",
    hoursPlayed: game.hoursPlayed?.toString() ?? "",
    lastPlayedAt: game.lastPlayedAt ? game.lastPlayedAt.slice(0, 16) : "",
    notes: game.notes ?? "",
    favorite: Boolean(game.favorite),
    wishlist: Boolean(game.wishlist),
    igdbId: game.igdbId ? String(game.igdbId) : "",
    coverImage: game.coverImage ?? "",
    heroImage: game.heroImage ?? "",
    screenshotUrls: (game.screenshotUrls ?? []).join("\n"),
  };
}

function convertDraftToForm(draft: NonNullable<GameDraft>): Partial<GameFormState> {
  return {
    title: draft.title ?? "",
    platformId: draft.platformId ?? "",
    platformName: draft.platformName ?? "",
    region: draft.region ?? "",
    status: draft.status ?? "backlog",
    format: draft.format ?? "rom",
    source: draft.source ?? "",
    fileName: draft.fileName ?? "",
    folderPath: draft.folderPath ?? "",
    emulatorCore: draft.emulatorCore ?? "",
    shaderPreset: draft.shaderPreset ?? "",
    tags: draft.tags ? draft.tags.join(", ") : "",
    rating: draft.rating !== undefined ? String(draft.rating) : "",
    hoursPlayed: draft.hoursPlayed !== undefined ? String(draft.hoursPlayed) : "",
    lastPlayedAt: draft.lastPlayedAt ? draft.lastPlayedAt.slice(0, 16) : "",
    notes: draft.notes ?? "",
    favorite: Boolean(draft.favorite),
    wishlist: Boolean(draft.wishlist),
    igdbId: draft.igdbId !== undefined && draft.igdbId !== null ? String(draft.igdbId) : "",
    coverImage: draft.coverImage ?? "",
    heroImage: draft.heroImage ?? "",
    screenshotUrls: draft.screenshotUrls ? draft.screenshotUrls.join("\n") : "",
  };
}
