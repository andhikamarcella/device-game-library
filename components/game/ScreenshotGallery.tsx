"use client";

import { useState } from "react";

export type Screenshot = {
  id: number;
  image: string;
  width?: number;
  height?: number;
};

export function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const [active, setActive] = useState<Screenshot | null>(null);

  if (!screenshots.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {screenshots.map((shot) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setActive(shot)}
            className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/40 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-slate-800 dark:bg-slate-800/60"
          >
            <img src={shot.image} alt="Game screenshot" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {active ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setActive(null)}>
          <div
            className="relative max-h-full w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={active.image} alt="Expanded screenshot" className="h-full w-full object-contain" loading="lazy" />
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-900/70 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
