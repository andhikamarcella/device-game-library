"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";
import type { IgdbVideo } from "@/lib/igdb";
import { cn } from "@/lib/utils";

const thumbnailFor = (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const EMBED_BASE = "https://www.youtube.com/embed";

const normalizeId = (value: string) => value.trim();

type VideoRole = "trailer" | "gameplay" | "teaser" | "interview" | "dev-diary" | "other";

const rolePriority: Record<VideoRole, number> = {
  trailer: 0,
  gameplay: 1,
  teaser: 2,
  interview: 3,
  "dev-diary": 3,
  other: 4,
};

const detectRole = (name?: string): VideoRole => {
  const normalized = name?.toLowerCase() ?? "";
  if (/trailer|launch|announcement/.test(normalized)) return "trailer";
  if (/gameplay|walkthrough|playthrough/.test(normalized)) return "gameplay";
  if (/teaser/.test(normalized)) return "teaser";
  if (/interview/.test(normalized)) return "interview";
  if (/dev\s*diary|developer diary|behind the scenes/.test(normalized)) return "dev-diary";
  return "other";
};

type PreparedVideo = IgdbVideo & { role: VideoRole; priority: number; thumbnail: string };

const prepareVideos = (videos: IgdbVideo[]): PreparedVideo[] => {
  return videos
    .filter((video): video is IgdbVideo => Boolean(video?.video_id))
    .map((video, index) => {
      const video_id = normalizeId(video.video_id);
      const role = detectRole(video.name);
      return {
        ...video,
        id: typeof video.id === "number" ? video.id : index + 1,
        name: video.name?.trim() || `Trailer ${index + 1}`,
        role,
        priority: rolePriority[role] ?? rolePriority.other,
        thumbnail: thumbnailFor(video_id),
        video_id,
      } satisfies PreparedVideo;
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (a.id ?? 0) - (b.id ?? 0);
    });
};

interface VideoCarouselProps {
  videos: IgdbVideo[];
}

export function VideoCarousel({ videos }: VideoCarouselProps) {
  const prepared = useMemo(() => prepareVideos(videos), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [prepared.length]);

  const hasVideos = prepared.length > 0;
  const activeVideo = hasVideos ? prepared[Math.abs(activeIndex) % prepared.length] : null;

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + prepared.length) % prepared.length);
  }, [prepared.length]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % prepared.length);
  }, [prepared.length]);

  useEffect(() => {
    if (!hasVideos) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goPrev();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [goNext, goPrev, hasVideos]);

  const embedUrl = activeVideo ? `${EMBED_BASE}/${activeVideo.video_id}` : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Clapperboard className="h-5 w-5" aria-hidden="true" />
        <h2 className="text-base font-semibold uppercase tracking-[0.2em]">IGDB Trailers & Clips</h2>
      </div>

      {hasVideos ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50/80 shadow-2xl ring-1 ring-black/10 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:ring-white/5">
            <div className="aspect-video w-full bg-black/80">
              {embedUrl ? (
                <iframe
                  title={activeVideo?.name ?? "IGDB video"}
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : null}
            </div>

            <div className="absolute inset-y-0 left-0 flex items-center px-3">
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full bg-white/80 p-2 text-slate-800 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white dark:bg-slate-800/80 dark:text-slate-50 dark:ring-slate-700"
                aria-label="Previous video"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-3">
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-white/80 p-2 text-slate-800 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white dark:bg-slate-800/80 dark:text-slate-50 dark:ring-slate-700"
                aria-label="Next video"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/80 bg-gradient-to-r from-white/70 via-white/60 to-white/70 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 dark:text-slate-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-white/5 dark:text-slate-200">
                {activeVideo?.role ?? "other"}
              </span>
              <span className="truncate text-right text-sm font-semibold text-slate-900 dark:text-white">
                {activeVideo?.name ?? "IGDB video"}
              </span>
            </div>
          </div>

          {prepared.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {prepared.map((video, index) => (
                <button
                  key={`${video.video_id}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-56 flex-none flex-col rounded-xl border bg-white/70 p-2 text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:ring-emerald-400/50 dark:border-slate-800/80 dark:bg-slate-900/80 dark:ring-white/10",
                    index === activeIndex
                      ? "border-emerald-400 shadow-emerald-200/30 ring-emerald-400/60 dark:shadow-emerald-900/40"
                      : "border-slate-200/80",
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900/80">
                    <img src={video.thumbnail} alt={video.name ?? "Trailer thumbnail"} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity hover:opacity-100">
                      <Clapperboard className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      {video.role}
                    </span>
                    <span className="truncate font-semibold">{video.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No trailers or clips available for this game.</p>
      )}
    </div>
  );
}
