"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Clock3, NotebookPen, PlayCircle } from "lucide-react";

import { useLibrary } from "@/components/library/LibraryProvider";
import type { UserGameRow } from "@/lib/user-games";

const ownershipChips: UserGameRow["ownership"][] = [
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusChips: UserGameRow["status"][] = ["not_started", "playing", "beaten", "completed", "dropped"];

const sortOptions = [
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
  { value: "released-desc", label: "Release year" },
  { value: "rating-desc", label: "RAWG rating" },
  { value: "personal-desc", label: "My rating" },
  { value: "played-desc", label: "Last played" },
  { value: "created-desc", label: "Recently added" },
];

export function LibrarySection() {
  const { games } = useLibrary();
  const [ownershipFilter, setOwnershipFilter] = useState<UserGameRow["ownership"][]>([]);
  const [statusFilter, setStatusFilter] = useState<UserGameRow["status"] | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<string>("created-desc");

  const availablePlatforms = useMemo(() => {
    const set = new Set<string>();
    games.forEach((game) => (game.platforms ?? []).forEach((platform) => set.add(platform)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((game) => (game.genres ?? []).forEach((genre) => set.add(genre)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        if (ownershipFilter.length && !ownershipFilter.includes(game.ownership)) {
          return false;
        }
        if (statusFilter !== "all" && game.status !== statusFilter) {
          return false;
        }
        if (platformFilter !== "all") {
          const platforms = game.platforms ?? [];
          if (!platforms.includes(platformFilter)) return false;
        }
        if (genreFilter !== "all") {
          const genres = game.genres ?? [];
          if (!genres.includes(genreFilter)) return false;
        }
        if (minRating > 0) {
          if ((game.personal_rating ?? 0) < minRating) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ratingA = typeof a.rawg_rating === "number" ? a.rawg_rating : Number(a.rawg_rating ?? 0);
        const ratingB = typeof b.rawg_rating === "number" ? b.rawg_rating : Number(b.rawg_rating ?? 0);
        const personalA = a.personal_rating ?? 0;
        const personalB = b.personal_rating ?? 0;
        switch (sort) {
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "released-desc":
            return (b.released ?? "").localeCompare(a.released ?? "");
          case "rating-desc":
            return ratingB - ratingA;
          case "personal-desc":
            return personalB - personalA;
          case "played-desc":
            return new Date(b.last_played_at ?? 0).getTime() - new Date(a.last_played_at ?? 0).getTime();
          case "created-desc":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [games, ownershipFilter, statusFilter, platformFilter, genreFilter, minRating, sort]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My library</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredGames.length} of {games.length} games shown
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Ownership
              <div className="flex flex-wrap gap-2">
                {ownershipChips.map((chip) => {
                  const active = ownershipFilter.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setOwnershipFilter((current) =>
                          current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip],
                        )
                      }
                      className={clsx(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                        active
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                          : "border-slate-300/70 text-slate-500 hover:border-emerald-400 hover:text-emerald-400 dark:border-slate-700 dark:text-slate-300",
                      )}
                    >
                      {chip.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </label>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="all">All</option>
              {statusChips.map((chip) => (
                <option key={chip} value={chip}>
                  {chip.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Platform
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="all">All</option>
              {availablePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Genre
            <select
              value={genreFilter}
              onChange={(event) => setGenreFilter(event.target.value)}
              className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="all">All</option>
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Min rating
            <input
              type="number"
              min={0}
              max={10}
              value={minRating}
              onChange={(event) => setMinRating(Number(event.target.value))}
              className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredGames.map((game) => (
          <article
            key={game.id}
            className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-20 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/40 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
                {game.cover_image ? (
                  <img src={game.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    No art
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Link
                  href={`/games/${game.rawg_id}`}
                  className="text-base font-semibold text-emerald-500 transition hover:text-emerald-300"
                >
                  {game.title}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatYear(game.released)} · {(game.platforms ?? []).join(", ") || "Unknown platform"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  RAWG {formatRating(game.rawg_rating)} · My rating {game.personal_rating ?? "—"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {game.genres?.join(", ") || "Genres unknown"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                {game.status.replace(/_/g, " ")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {game.playtime_hours ? `${game.playtime_hours}h` : "No playtime"}
              </span>
              <span className="inline-flex items-center gap-1">
                <NotebookPen className="h-3.5 w-3.5" />
                {game.notes ? "Notes" : "No notes"}
              </span>
            </div>
          </article>
        ))}
        {!filteredGames.length ? (
          <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            No games match the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatRating(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "—";
  }
  return numeric.toFixed(1);
}

function formatYear(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return String(parsed.getFullYear());
}
