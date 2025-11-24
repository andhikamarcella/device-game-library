"use client";

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
      <img
        src={src}
        alt={alt}
        width={1600}
        height={900}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-contain transition-all duration-700",
          loaded ? "opacity-100" : "opacity-0 blur-md",
        )}
      />
    </div>
  );
}
