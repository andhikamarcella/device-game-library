"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { collectIgdbVideos } from "@/lib/gameMedia";
import type { GameDetailsPayload } from "@/lib/gameData";

type GameTrailerSectionProps = {
  game: GameDetailsPayload;
  className?: string;
};

export function GameTrailerSection({ game, className }: GameTrailerSectionProps) {
  const videos = useMemo(() => collectIgdbVideos(game), [game]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [videos.length]);

  const headingId = `game-trailer-${game.id}`;

  if (!game.name) {
    return null;
  }

  const activeVideo = videos[activeIndex] ?? null;
  const embedUrl = activeVideo ? `https://www.youtube.com/embed/${activeVideo.youtubeId}` : null;

  return (
    <section className={`space-y-3 ${className ?? ""}`} aria-labelledby={headingId}>
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Play className="h-4 w-4" aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-semibold uppercase tracking-widest">
          IGDB trailers & clips
        </h2>
      </div>
      {activeVideo && embedUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/90 text-white shadow-lg dark:border-slate-800">
          <div className="aspect-video w-full bg-black">
            <iframe
              title={activeVideo.title || `${game.name} trailer`}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="space-y-1 px-4 py-3 text-sm">
            <p className="font-semibold text-white">{activeVideo.title || `${game.name} trailer`}</p>
            <p className="text-xs uppercase tracking-wide text-slate-300">Provided by IGDB</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <p className="font-medium">No IGDB trailers or clips available.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This game did not include preview media from IGDB.</p>
        </div>
      )}
      {videos.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {videos.map((video, index) => (
            <button
              key={`${video.youtubeId}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`flex-none rounded-lg border ${
                index === activeIndex
                  ? "border-emerald-500 ring-2 ring-emerald-400"
                  : "border-slate-300 dark:border-slate-700"
              } bg-slate-900/60 shadow-sm transition hover:border-emerald-500`}
            >
              <div className="aspect-video w-40 overflow-hidden rounded-lg bg-black">
                <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
              </div>
              <div className="px-3 py-2 text-left text-xs font-semibold text-white">{video.title}</div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
