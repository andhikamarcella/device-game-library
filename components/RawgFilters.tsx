"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Most popular", value: "-added" },
  { label: "Top rated", value: "-rating" },
  { label: "Metacritic", value: "-metacritic" },
  { label: "Newest", value: "-released" },
  { label: "Name A–Z", value: "name" },
];

const PLATFORM_OPTIONS = [
  { label: "Any platform", value: "" },
  { label: "PC", value: "6" },
  { label: "PlayStation 4", value: "48" },
  { label: "PlayStation 5", value: "167" },
  { label: "Xbox One", value: "49" },
  { label: "Xbox Series X|S", value: "169" },
  { label: "Nintendo Switch", value: "130" },
  { label: "macOS", value: "14" },
  { label: "Linux", value: "3" },
  { label: "Android", value: "34" },
  { label: "iOS", value: "39" },
];

const GENRE_OPTIONS = [
  { label: "Any genre", value: "" },
  { label: "Action", value: "4,5,25,33" },
  { label: "Adventure", value: "31" },
  { label: "RPG", value: "12" },
  { label: "Shooter", value: "5" },
  { label: "Puzzle", value: "9" },
  { label: "Racing", value: "10" },
  { label: "Simulation", value: "13" },
  { label: "Indie", value: "32" },
];

export interface RawgFiltersProps {
  initialQuery?: string;
  initialSort?: string;
  initialPlatform?: string;
  initialGenre?: string;
  initialFrom?: string;
  initialTo?: string;
  initialMcMin?: string;
  initialMcMax?: string;
  initialTags?: string;
}

export function RawgFilters({
  initialQuery,
  initialSort,
  initialPlatform,
  initialGenre,
  initialFrom,
  initialTo,
  initialMcMin,
  initialMcMax,
  initialTags,
}: RawgFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQuery ?? "");
  const [sort, setSort] = useState(initialSort ?? "");
  const [platform, setPlatform] = useState(initialPlatform ?? "");
  const [genre, setGenre] = useState(initialGenre ?? "");
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");
  const [mcMin, setMcMin] = useState(initialMcMin ?? "");
  const [mcMax, setMcMax] = useState(initialMcMax ?? "");
  const [tags, setTags] = useState(initialTags ?? "");

  function updateUrl() {
    const params = new URLSearchParams(searchParams.toString());

    if (q) params.set("q", q);
    else params.delete("q");

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    if (platform) params.set("platform", platform);
    else params.delete("platform");

    if (genre) params.set("genre", genre);
    else params.delete("genre");

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    if (mcMin) params.set("mc_min", mcMin);
    else params.delete("mc_min");

    if (mcMax) params.set("mc_max", mcMax);
    else params.delete("mc_max");

    if (tags) params.set("tags", tags);
    else params.delete("tags");

    params.delete("page");

    router.push(`?${params.toString()}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search games…"
          className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort by</label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Platform</label>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Genre</label>
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            {GENRE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">IGDB rating range</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={mcMin}
              onChange={(event) => setMcMin(event.target.value)}
              placeholder="min"
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={mcMax}
              onChange={(event) => setMcMax(event.target.value)}
              placeholder="max"
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Release date range</label>
        <div className="mt-1 flex gap-2">
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tags / keywords</label>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="pixel-art,open-world"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-400"
        >
          Apply filters
        </button>
      </div>
    </form>
  );
}
