"use client";

import { mapAgeRatingsToDisplay } from "@/lib/igdb/mapper";
import type { IgdbAgeRating } from "@/lib/igdb";

type AgeRatingProps = {
  ageRatings?: IgdbAgeRating[] | null;
};

export default function AgeRating({ ageRatings }: AgeRatingProps) {
  const mapped = mapAgeRatingsToDisplay(ageRatings).sort((a, b) => {
    if (a.system === b.system) return a.label.localeCompare(b.label);
    return a.system.localeCompare(b.system);
  });

  if (!mapped.length) {
    return <p className="text-sm text-muted-foreground">No age rating information available for this game.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {mapped.map((rating) => (
        <div
          key={rating.key}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-black/40 p-2">
            <img src={rating.icon} alt={`${rating.system} ${rating.label}`} className="h-full w-full object-contain" />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="font-semibold leading-tight text-foreground">{`${rating.system} ${rating.label}`}</p>
            <p className="text-sm text-muted-foreground">{rating.description}</p>
            {rating.synopsis ? (
              <p className="text-xs text-muted-foreground/80 line-clamp-2">{rating.synopsis}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
