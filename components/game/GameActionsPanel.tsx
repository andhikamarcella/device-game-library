"use client";

import { useMemo, useState } from "react";

import { useUserGameLibrary } from "@/hooks/useUserGameLibrary";
import type { Ownership, PlayStatus, UserGameEntry } from "@/lib/types";

const ownershipOptions: Ownership[] = [
  "none",
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusOptions: PlayStatus[] = ["not_started", "playing", "beaten", "completed", "dropped"];

type Props = {
  rawgId: number;
  slug: string;
  title: string;
  coverImage?: string | null;
  platforms: string[];
  genres: string[];
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number | null;
  playtime: number | null;
  metacritic: number | null;
  boxArtSource?: "rawg" | "tgdb";
};

export function GameActionsPanel(props: Props) {
  const { rawgId } = props;
  const { getGame, addOrUpdateGame, updateGame } = useUserGameLibrary();
  const entry = useMemo(() => getGame(rawgId), [getGame, rawgId]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(entry?.notes ?? "");

  const handleAdd = () => {
    addOrUpdateGame({
      rawgId: props.rawgId,
      slug: props.slug,
      title: props.title,
      coverImage: props.coverImage ?? null,
      platforms: props.platforms,
      ownership: "none",
      status: "not_started",
      personalRating: null,
      playtimeHours: props.playtime ?? 0,
      lastPlayedAt: null,
      notes: "",
      releaseYear: props.releaseYear,
      rawgRating: props.rating,
      rawgRatingsCount: props.ratingsCount ?? null,
      rawgPlaytime: props.playtime,
      metacritic: props.metacritic,
      genres: props.genres,
      boxArtSource: props.boxArtSource,
    });
  };

  const handleUpdate = (patch: Partial<UserGameEntry>) => {
    updateGame(rawgId, patch);
  };

  if (!entry) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        Add to my library
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Ownership
          <select
            value={entry.ownership}
            onChange={(event) => handleUpdate({ ownership: event.target.value as Ownership })}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {ownershipOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Status
          <select
            value={entry.status}
            onChange={(event) => handleUpdate({
              status: event.target.value as PlayStatus,
              lastPlayedAt: event.target.value === "playing" ? new Date().toISOString() : entry.lastPlayedAt ?? null,
            })}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          My rating
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={entry.personalRating ?? ""}
            onChange={(event) => handleUpdate({ personalRating: event.target.value ? Number(event.target.value) : null })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Playtime (hours)
          <input
            type="number"
            min={0}
            value={entry.playtimeHours ?? 0}
            onChange={(event) => handleUpdate({ playtimeHours: Number(event.target.value) })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => setNotesOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-200"
      >
        {notesOpen ? "Close notes" : "Edit notes"}
      </button>
      {notesOpen && (
        <div className="space-y-2">
          <textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNotesDraft(entry.notes ?? "");
                setNotesOpen(false);
              }}
              className="rounded-md px-3 py-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleUpdate({ notes: notesDraft });
                setNotesOpen(false);
              }}
              className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Save notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

