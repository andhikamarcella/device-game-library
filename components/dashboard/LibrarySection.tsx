"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { useUserGameLibrary } from "@/hooks/useUserGameLibrary";
import type { Ownership, PlayStatus, UserGameEntry } from "@/lib/types";

const ownershipOptions: Ownership[] = [
  "none",
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusOptions: (PlayStatus | "all")[] = ["all", "not_started", "playing", "beaten", "completed", "dropped"];

const sortOptions = [
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
  { value: "release", label: "Release year" },
  { value: "rawg", label: "RAWG rating" },
  { value: "personal", label: "Personal rating" },
  { value: "last-played", label: "Last played" },
  { value: "created", label: "Recently added" },
];

export function LibrarySection() {
  const { games, updateGame, removeGame } = useUserGameLibrary();
  const [ownershipFilter, setOwnershipFilter] = useState<Ownership[]>([...ownershipOptions]);
  const [statusFilter, setStatusFilter] = useState<PlayStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("created");

  const platforms = useMemo(() => {
    const set = new Set<string>();
    games.forEach((game) => game.platforms.forEach((platform) => set.add(platform)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const filtered = useMemo(() => {
    return games
      .filter((game) => ownershipFilter.includes(game.ownership))
      .filter((game) => (statusFilter === "all" ? true : game.status === statusFilter))
      .filter((game) => (platformFilter ? game.platforms.includes(platformFilter) : true))
      .filter((game) => (minRating > 0 ? (game.personalRating ?? 0) >= minRating : true));
  }, [games, ownershipFilter, statusFilter, platformFilter, minRating]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      switch (sort) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "release":
          return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
        case "rawg":
          return (b.rawgRating ?? 0) - (a.rawgRating ?? 0);
        case "personal":
          return (b.personalRating ?? 0) - (a.personalRating ?? 0);
        case "last-played":
          return new Date(b.lastPlayedAt ?? 0).getTime() - new Date(a.lastPlayedAt ?? 0).getTime();
        case "created":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return copy;
  }, [filtered, sort]);

  const toggleOwnership = (value: Ownership) => {
    setOwnershipFilter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handlePersonalRating = (entry: UserGameEntry, value: number) => {
    updateGame(entry.rawgId, { personalRating: value });
  };

  const handleStatus = (entry: UserGameEntry, value: PlayStatus) => {
    updateGame(entry.rawgId, { status: value, lastPlayedAt: value === "playing" ? new Date().toISOString() : entry.lastPlayedAt });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">My library</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap gap-2">
            {ownershipOptions.map((option) => {
              const active = ownershipFilter.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOwnership(option)}
                  className={`rounded-full border px-3 py-1 transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700"
                  }`}
                >
                  {option.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PlayStatus | "all")}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="">All platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-300">Min rating</span>
            <input
              type="number"
              min={0}
              max={10}
              value={minRating}
              onChange={(event) => setMinRating(Number(event.target.value))}
              className="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm dark:border-slate-700"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-6 text-center text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300">
          Your library is empty. Search for a game above and add it to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((entry) => (
            <article
              key={entry.rawgId}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/80"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-slate-200/60 dark:bg-slate-800/60">
                  {entry.coverImage ? (
                    <img src={entry.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No art</div>
                  )}
                </div>
                <div className="space-y-1">
                  <Link href={`/games/${entry.slug ?? entry.rawgId}`} className="text-base font-semibold text-emerald-600 hover:underline dark:text-emerald-300">
                    {entry.title}
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {entry.releaseYear ? `Released ${entry.releaseYear}` : "Release year unknown"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.platforms.length > 0 ? entry.platforms.join(", ") : "Platform info missing"}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <dt className="uppercase">Status</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.status.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt className="uppercase">Ownership</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.ownership.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt className="uppercase">Personal rating</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.personalRating ?? "—"}</dd>
                </div>
                <div>
                  <dt className="uppercase">RAWG rating</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.rawgRating ? entry.rawgRating.toFixed(1) : "—"}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Adjust status</span>
                  <select
                    value={entry.status}
                    onChange={(event) => handleStatus(entry, event.target.value as PlayStatus)}
                    className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    {statusOptions
                      .filter((status): status is PlayStatus => status !== "all")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Personal rating</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={entry.personalRating ?? 0}
                    onChange={(event) => handlePersonalRating(entry, Number(event.target.value))}
                    className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-300">
                  <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => removeGame(entry.rawgId)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500 px-3 py-1 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>

              {entry.notes && (
                <p className="rounded-lg bg-slate-100/70 p-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                  {entry.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

