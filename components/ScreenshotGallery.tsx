import Image from "next/image";

import { igdbScreenshotUrl } from "@/lib/igdbImages";

interface Screenshot {
  id: number;
  image: string;
  image_id?: string | null;
  width?: number;
  height?: number;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
}

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  if (!screenshots.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Screenshots</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {screenshots.map((shot) => {
          const url = igdbScreenshotUrl(shot.image_id ?? null) ?? shot.image;
          if (!url) return null;
          return (
            <div
              key={shot.id}
              className="flex-none w-36 sm:w-40 aspect-video overflow-hidden rounded-lg bg-slate-900"
            >
              <Image
                src={url}
                alt="Screenshot"
                width={320}
                height={180}
                className="h-full w-full object-cover"
                sizes="(max-width: 640px) 50vw, 320px"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
