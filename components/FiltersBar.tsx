"use client";

import { type Ownership, type PlayStatus } from "@/hooks/LibraryProvider";

export type SortOption = "title" | "release_year" | "igdb_rating" | "personal_rating" | "added_date" | "last_played";

interface FiltersBarProps {
  ownership: Ownership | "all";
  onOwnershipChange: (value: Ownership | "all") => void;
  status: PlayStatus | "all";
  onStatusChange: (value: PlayStatus | "all") => void;
  platform: string | "all";
  onPlatformChange: (value: string | "all") => void;
  availablePlatforms: string[];
  minRating: number | null;
  onMinRatingChange: (value: number | null) => void;
  sortOrder: SortOption;
  onSortOrderChange: (value: SortOption) => void;
}

export function FiltersBar({
  ownership,
  onOwnershipChange,
  status,
  onStatusChange,
  platform,
  onPlatformChange,
  availablePlatforms,
  minRating,
  onMinRatingChange,
  sortOrder,
  onSortOrderChange,
}: FiltersBarProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Library filters</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ownership</span>
          <select
            value={ownership}
            onChange={(event) => onOwnershipChange(event.target.value as Ownership | "all")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All</option>
            <option value="wishlist">Wishlist</option>
            <option value="owned_digital">Owned (Digital)</option>
            <option value="owned_physical">Owned (Physical)</option>
            <option value="emulator_only">Emulator only</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as PlayStatus | "all")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All</option>
            <option value="not_started">Not started</option>
            <option value="playing">Playing</option>
            <option value="beaten">Beaten</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Platform</span>
          <select
            value={platform}
            onChange={(event) => onPlatformChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All</option>
            {availablePlatforms.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Min personal rating</span>
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={minRating ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              if (!next) {
                onMinRatingChange(null);
              } else {
                const parsed = Number.parseInt(next, 10);
                onMinRatingChange(Number.isFinite(parsed) ? parsed : null);
              }
            }}
            placeholder="Any"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sort by</span>
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="title">Title</option>
            <option value="release_year">Release year</option>
            <option value="igdb_rating">IGDB rating</option>
            <option value="personal_rating">Personal rating</option>
            <option value="added_date">Added date</option>
            <option value="last_played">Last played</option>
          </select>
        </label>
      </div>
    </section>
  );
}
