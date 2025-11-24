"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { bestImageOriginal } from "@/lib/igdb";
import { cn } from "@/lib/utils";

interface HDImageProps {
  imageId?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  rounded?: boolean;
}

const FALLBACK_BLUR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Cfilter id='b' x='-50%25' y='-50%25' width='200%25' height='200%25'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='2' /%3E%3C/filter%3E%3Crect width='16' height='9' fill='%23121b2f' filter='url(%23b)'/%3E%3C/svg%3E";

const buildHdUrl = (imageId?: string | null) => bestImageOriginal(imageId);

export function HDImage({ imageId, alt = "Screenshot", className, priority, rounded = true }: HDImageProps) {
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => buildHdUrl(imageId), [imageId]);

  if (!src) return null;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-slate-900/80",
        rounded ? "rounded-xl" : "rounded-lg",
        className,
      )}
    >
      {!loaded ? <div className="absolute inset-0 animate-pulse rounded-xl bg-slate-800/70" /> : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority={priority}
        placeholder="blur"
        blurDataURL={FALLBACK_BLUR}
        onLoadingComplete={() => setLoaded(true)}
        className={cn(
          "object-contain transition-all duration-700",
          loaded ? "opacity-100" : "opacity-0 blur-md",
        )}
      />
    </div>
  );
}
