"use client";

import Image from "next/image";
import { useState } from "react";

interface Screenshot {
  id: number;
  image: string;
  width?: number;
  height?: number;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
}

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [active, setActive] = useState<Screenshot | null>(null);

  if (!screenshots.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Screenshots</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Click to view larger</p>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {screenshots.map((shot) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setActive(shot)}
            className="relative h-40 w-72 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <Image
              src={shot.image}
              alt="Screenshot"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80vw, 33vw"
            />
          </button>
        ))}
      </div>
      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setActive(null)}>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={active.image}
              alt="Expanded screenshot"
              width={active.width ?? 1920}
              height={active.height ?? 1080}
              className="h-full w-full object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
