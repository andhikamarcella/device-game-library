"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = typeof activeIndex === "number" ? screenshots[activeIndex] : null;

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return null;
      return (index - 1 + screenshots.length) % screenshots.length;
    });
  }, [screenshots.length]);
  const showNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return null;
      return (index + 1) % screenshots.length;
    });
  }, [screenshots.length]);

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, close, showNext, showPrev]);

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
        {screenshots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setActiveIndex(index)}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close screenshot" onClick={close} />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/20 bg-slate-900 shadow-2xl">
            <Image
              src={active.image}
              alt="Expanded screenshot"
              width={active.width ?? 1920}
              height={active.height ?? 1080}
              className="h-full w-full object-contain"
              sizes="100vw"
            />
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                aria-label="Previous screenshot"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                aria-label="Next screenshot"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                close();
              }}
              className="absolute right-4 top-4 rounded-full bg-slate-900/70 px-3 py-1 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
