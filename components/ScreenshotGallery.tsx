"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { ScreenshotModal } from "@/components/ScreenshotModal";
import { igdbScreenshotUrl } from "@/lib/igdbImages";
import type { GameScreenshot } from "@/lib/gameData";

interface ScreenshotGalleryProps {
  screenshots: GameScreenshot[];
}

const buildHdUrl = (imageId?: string | null, fallback?: string | null) =>
  imageId ? `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg` : fallback ?? null;

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => screenshots.filter((shot) => Boolean(shot.image_id || shot.image)), [screenshots]);

  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Screenshots</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth">
        {items.map((shot, index) => {
          const url = igdbScreenshotUrl(shot.image_id ?? null) ?? buildHdUrl(shot.image_id ?? null, shot.image);
          if (!url) return null;
          return (
            <button
              type="button"
              key={`${shot.id}-${index}`}
              className="group relative flex-none w-36 sm:w-40 aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-sm transition hover:opacity-80"
              onClick={() => {
                setActiveIndex(index);
                setIsOpen(true);
              }}
            >
              <Image
                src={url}
                alt="Screenshot"
                width={320}
                height={180}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 60vw, 320px"
              />
            </button>
          );
        })}
      </div>

      <ScreenshotModal
        isOpen={isOpen}
        images={items}
        startIndex={activeIndex}
        onClose={() => setIsOpen(false)}
      />
    </section>
  );
}
