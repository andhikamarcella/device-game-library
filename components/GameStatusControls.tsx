"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { type Ownership, type PlayStatus, type UserGame } from "@/hooks/LibraryProvider";

const ownershipOptions: Array<{ label: string; value: Ownership }> = [
  { label: "None", value: "none" },
  { label: "Wishlist", value: "wishlist" },
  { label: "Owned (Digital)", value: "owned_digital" },
  { label: "Owned (Physical)", value: "owned_physical" },
  { label: "Emulator Only", value: "emulator_only" },
];

const statusOptions: Array<{ label: string; value: PlayStatus }> = [
  { label: "Not started", value: "not_started" },
  { label: "Playing", value: "playing" },
  { label: "Beaten", value: "beaten" },
  { label: "Completed", value: "completed" },
  { label: "Dropped", value: "dropped" },
];

interface GameStatusControlsProps {
  userGame: UserGame;
  onUpdate: (igdbId: number, patch: Partial<UserGame>) => void;
  onRemove?: (igdbId: number) => void;
}

export function GameStatusControls({ userGame, onUpdate, onRemove }: GameStatusControlsProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(userGame.notes ?? "");

  const handleOwnershipChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(userGame.igdbId, { ownership: event.target.value as Ownership });
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(userGame.igdbId, { status: event.target.value as PlayStatus });
  };

  const handlePlaytimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    onUpdate(userGame.igdbId, { playtimeHours: Number.isFinite(value) && value >= 0 ? value : 0 });
  };

  const handleLastPlayedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onUpdate(userGame.igdbId, { lastPlayedAt: value ? new Date(value).toISOString() : null });
  };

  const handleNotesSave = () => {
    onUpdate(userGame.igdbId, { notes: notesDraft.trim() ? notesDraft.trim() : null });
    setNotesOpen(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Ownership</span>
          <select
            value={userGame.ownership}
            onChange={handleOwnershipChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {ownershipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
          <select
            value={userGame.status}
            onChange={handleStatusChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Personal rating</span>
          <RatingStars
            value={userGame.personalRating ?? null}
            onChange={(next) => onUpdate(userGame.igdbId, { personalRating: next })}
          />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Playtime (hrs)</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={Number.isFinite(userGame.playtimeHours) ? userGame.playtimeHours : 0}
            onChange={handlePlaytimeChange}
            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last played</span>
          <input
            type="date"
            value={userGame.lastPlayedAt ? new Date(userGame.lastPlayedAt).toISOString().slice(0, 10) : ""}
            onChange={handleLastPlayedChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setNotesDraft(userGame.notes ?? "");
            setNotesOpen(true);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
        >
          {userGame.notes ? "Edit notes" : "Add notes"}
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(userGame.igdbId)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200 dark:hover:border-red-800 dark:hover:bg-red-900/40"
          >
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        ) : null}
      </div>

      {notesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal notes</h2>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={6}
              className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Thoughts, strategies, backlog notes..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNotesOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotesSave}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Save notes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
