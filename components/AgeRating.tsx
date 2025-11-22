"use client";

import Image from "next/image";

import { AGE_RATING_LABELS, AGE_RATING_MAP, type AgeRatingCategory } from "@/lib/age-rating";
import type { IgdbAgeRating } from "@/lib/igdb";

type AgeRatingProps = {
  ageRatings?: IgdbAgeRating[] | null;
};

const resolveLabel = (category: AgeRatingCategory, rating: number | null | undefined): string => {
  if (rating == null) return "Rating Unknown";
  const labelMap = AGE_RATING_LABELS[category];
  if (!labelMap) return "Rating Unknown";
  return labelMap[rating] ?? labelMap[String(rating)] ?? "Rating Unknown";
};

export default function AgeRating({ ageRatings }: AgeRatingProps) {
  const normalized = (ageRatings ?? [])
    .map((rating) => {
      const categoryValue = rating?.category;
      if (!categoryValue || !Object.hasOwn(AGE_RATING_MAP, categoryValue)) return null;

      const categoryKey = categoryValue as AgeRatingCategory;
      const system = AGE_RATING_MAP[categoryKey];
      const label = resolveLabel(categoryKey, rating?.rating ?? null);
      const description = rating?.synopsis?.trim();
      return {
        id: rating?.id ?? `${categoryKey}-${label}`,
        system,
        label,
        description,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const unique = Array.from(
    normalized.reduce((map, entry) => {
      const key = `${entry.system.system}-${entry.label}`;
      if (!map.has(key)) map.set(key, entry);
      return map;
    }, new Map<string, (typeof normalized)[number]>()),
  ).map(([, value]) => value);

  if (!unique.length) {
    return (
      <p className="text-sm text-muted-foreground">No age rating information available for this game.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {unique.map((rating) => (
        <div
          key={rating.id}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 p-2">
            <Image
              src={rating.system.icon}
              alt={rating.system.system}
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-foreground">{rating.system.system}</span>
            <span className="text-xs text-muted-foreground">{rating.label}</span>
            {rating.description ? (
              <span className="text-xs text-muted-foreground/80 line-clamp-2">{rating.description}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
