"use client";

import Image from "next/image";

import { AGE_RATING_MAP, resolveAgeLabel, type AgeRatingCategory } from "@/lib/age-rating";
import type { IgdbAgeRating } from "@/lib/igdb";

type AgeRatingProps = {
  ageRatings?: IgdbAgeRating[] | null;
};

export default function AgeRating({ ageRatings }: AgeRatingProps) {
  if (!ageRatings || ageRatings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No age rating information available for this game.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ageRatings.map((rating, idx) => {
        const categoryValue = rating?.category;
        if (!categoryValue || !Object.hasOwn(AGE_RATING_MAP, categoryValue)) return null;

        const categoryKey = categoryValue as AgeRatingCategory;
        const system = AGE_RATING_MAP[categoryKey];
        const label = resolveAgeLabel(categoryKey, rating?.rating);
        const description = rating?.synopsis?.trim();

        return (
          <div
            key={`${categoryKey}-${rating?.id ?? idx}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 p-2">
              <Image
                src={system.icon}
                alt={system.system}
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">{system.system}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
              {description ? (
                <span className="text-xs text-muted-foreground/80 line-clamp-2">{description}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
