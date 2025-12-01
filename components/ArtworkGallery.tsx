"use client";

import { useState } from "react";

import { bestImageOriginal } from "@/lib/igdb";
import type { GameArtwork } from "@/lib/gameData";

interface ArtworkGalleryProps {
  artworks: GameArtwork[] | null | undefined;
}

export default function ArtworkGallery({ artworks }: ArtworkGalleryProps) {
  const [active, setActive] = useState<number | null>(null);

  const items = (artworks ?? []).filter((art) => Boolean(art?.image_id));

  if (!items.length) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Artworks</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((a, idx) => (
          <button
            key={a.id ?? idx}
            onClick={() => setActive(idx)}
            className="overflow-hidden rounded-xl group"
          >
            <img
              src={bestImageOriginal(a.image_id) ?? ""}
              alt="Artwork"
              width={600}
              height={400}
              className="object-cover w-full h-40 group-hover:scale-105 transition"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/10 p-3 rounded-full hover:bg-white/20 transition"
            onClick={(e) => {
              e.stopPropagation();
              setActive((prev) => {
                if (prev === null) return 0;
                return prev === 0 ? items.length - 1 : prev - 1;
              });
            }}
            aria-label="Previous artwork"
          >
            ←
          </button>

          <img
            src={bestImageOriginal(items[active].image_id) ?? ""}
            alt="Artwork"
            width={1600}
            height={900}
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-cover"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/10 p-3 rounded-full hover:bg-white/20 transition"
            onClick={(e) => {
              e.stopPropagation();
              setActive((prev) => {
                if (prev === null) return 0;
                return prev === items.length - 1 ? 0 : prev + 1;
              });
            }}
            aria-label="Next artwork"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
