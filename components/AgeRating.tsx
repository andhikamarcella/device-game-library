"use client";

import Image from "next/image";

import { AGE_RATING_MAP, type AgeRatingInfo } from "@/lib/ageRatingMap";
import type { IgdbAgeRating } from "@/lib/igdb";

type AgeRatingProps = {
  ratings?: IgdbAgeRating[] | null;
};

type AgeRatingEntry = AgeRatingInfo & { synopsis: string | null; key: number };

export default function AgeRating({ ratings }: AgeRatingProps) {
  const mapped = (ratings ?? [])
    .map((rating, index) => {
      const code = typeof rating?.rating === "number" ? rating.rating : null;
      if (code == null) return null;
      const info = AGE_RATING_MAP[code];
      if (!info) return null;
      return {
        ...info,
        synopsis: rating?.synopsis?.trim() || null,
        key: rating.id ?? index,
      };
    })
    .filter((entry): entry is AgeRatingEntry => Boolean(entry));

  const unique: AgeRatingEntry[] = [];
  const seen = new Set<string>();
  for (const entry of mapped) {
    const key = `${entry.system}-${entry.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }

  if (!unique.length) {
    return <p className="text-sm text-muted-foreground">No age rating information available for this game.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {unique.map((rating) => (
        <div
          key={rating.key}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-black/40 p-2">
            <Image src={rating.icon} alt={rating.label} width={48} height={48} className="h-full w-full object-contain" />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="font-semibold leading-tight text-foreground">{rating.system}</p>
            <p className="text-sm text-muted-foreground">{rating.label}</p>
            {rating.synopsis ? (
              <p className="text-xs text-muted-foreground/80 line-clamp-2">{rating.synopsis}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
