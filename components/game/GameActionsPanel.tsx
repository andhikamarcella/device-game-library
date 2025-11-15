"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";

import { addGameToLibraryAction, updateUserGameAction } from "@/app/actions/user-games";
import type { UserGameRow } from "@/lib/user-games";

type Metadata = {
  rawgId: number;
  slug: string;
  title: string;
  coverImage: string | null;
  platforms: string[];
  genres: string[];
  released: string | null;
  rating: number | null;
  ratingsCount: number | null;
  playtime: number | null;
};

type Props = {
  metadata: Metadata;
  entry: UserGameRow | null;
};

const ownershipOptions: UserGameRow["ownership"][] = [
  "none",
  "wishlist",
  "owned_digital",
  "owned_physical",
  "emulator_only",
];

const statusOptions: UserGameRow["status"][] = ["not_started", "playing", "beaten", "completed", "dropped"];

export function GameActionsPanel({ metadata, entry }: Props) {
  const [currentEntry, setCurrentEntry] = useState<UserGameRow | null>(entry);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(entry?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      const saved = await addGameToLibraryAction({
        rawgId: metadata.rawgId,
        slug: metadata.slug,
        title: metadata.title,
        coverImage: metadata.coverImage,
        platforms: metadata.platforms,
        genres: metadata.genres,
        released: metadata.released,
        rating: metadata.rating,
        ratingsCount: metadata.ratingsCount,
        playtime: metadata.playtime,
      });
      setCurrentEntry(saved);
      setNotesDraft(saved.notes ?? "");
    });
  };

  const handleUpdate = (updates: Partial<UserGameRow>) => {
    if (!currentEntry) return;
    startTransition(async () => {
      const updated = await updateUserGameAction({
        id: currentEntry.id,
        ownership: updates.ownership ?? currentEntry.ownership,
        status: updates.status ?? currentEntry.status,
        personal_rating: updates.personal_rating ?? currentEntry.personal_rating,
        playtime_hours: updates.playtime_hours ?? currentEntry.playtime_hours,
        last_played_at: updates.last_played_at ?? currentEntry.last_played_at,
        notes: updates.notes ?? currentEntry.notes,
        cover_image: updates.cover_image ?? currentEntry.cover_image,
        platforms: updates.platforms ?? currentEntry.platforms,
        genres: updates.genres ?? currentEntry.genres,
      });
      setCurrentEntry(updated);
      setNotesDraft(updated.notes ?? "");
      if (updates.notes !== undefined) {
        setNotesOpen(false);
      }
    });
  };

  if (!currentEntry) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add to my library"}
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Ownership
          <select
            value={currentEntry.ownership}
            onChange={(event) => handleUpdate({ ownership: event.target.value as UserGameRow["ownership"] })}
            className="mt-2 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
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
            value={currentEntry.status}
            onChange={(event) => handleUpdate({ status: event.target.value as UserGameRow["status"] })}
            className="mt-2 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
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
            value={currentEntry.personal_rating ?? ""}
            onChange={(event) =>
              handleUpdate({ personal_rating: event.target.value ? Number(event.target.value) : null })
            }
            className="w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Playtime (hours)
          <input
            type="number"
            min={0}
            value={currentEntry.playtime_hours ?? ""}
            onChange={(event) =>
              handleUpdate({ playtime_hours: event.target.value ? Number(event.target.value) : null })
            }
            className="w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => setNotesOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-200"
      >
        {currentEntry.notes ? "Edit notes" : "Add notes"}
      </button>
      {notesOpen ? (
        <div className="space-y-3">
          <textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            className="w-full rounded-xl border border-slate-300/60 bg-white/70 p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            rows={5}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNotesOpen(false);
                setNotesDraft(currentEntry.notes ?? "");
              }}
              className="rounded-lg border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ notes: notesDraft })}
              className={clsx(
                "rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-400",
                isPending && "opacity-60",
              )}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
      {isPending ? <p className="text-xs text-slate-500 dark:text-slate-400">Saving changes…</p> : null}
    </div>
  );
}
