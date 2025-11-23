"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Expand, Minimize2, MonitorPlay } from "lucide-react";
import { useVideoAutoSwitch } from "@/hooks/useVideoAutoSwitch";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { cn } from "@/lib/utils";

export type VideoQuality = "480p" | "720p" | "1080p";

export interface VideoSourceVariant {
  label: string;
  key: VideoQuality;
  sources: Array<{ src: string; type: string }>;
}

interface VideoPlayerProps {
  videoKey: string;
  title: string;
  poster?: string | null;
  activeQuality: VideoQuality;
  variants: VideoSourceVariant[];
  onQualityChange: (quality: VideoQuality) => void;
  onEnded: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTheater: boolean;
  toggleTheater: () => void;
  isMini: boolean;
  onCloseMini: () => void;
}

export function VideoPlayer({
  title,
  videoKey,
  poster,
  activeQuality,
  variants,
  onQualityChange,
  onEnded,
  onSwipeLeft,
  onSwipeRight,
  isTheater,
  toggleTheater,
  isMini,
  onCloseMini,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFading, setIsFading] = useState(false);
  const previousQualityRef = useRef<VideoQuality | null>(null);
  const previousVideoKeyRef = useRef<string | null>(null);

  const currentVariant = useMemo(
    () => variants.find((variant) => variant.key === activeQuality) ?? variants[0],
    [activeQuality, variants],
  );

  useVideoAutoSwitch(videoRef, onEnded);
  useSwipeNavigation(wrapperRef, { onSwipeLeft, onSwipeRight });

  useEffect(() => {
    setIsFading(true);
    const id = window.setTimeout(() => setIsFading(false), 180);
    return () => window.clearTimeout(id);
  }, [currentVariant?.key, videoKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVariant) return;

    const sameQuality = previousQualityRef.current === currentVariant.key;
    const sameVideo = previousVideoKeyRef.current === videoKey;
    const resumeTime = sameVideo && sameQuality ? video.currentTime : 0;
    const wasPlaying = !video.paused && !video.ended;
    const shouldAutoPlay = wasPlaying || !sameQuality || !sameVideo;

    video.load();

    const handleLoaded = () => {
      if (resumeTime > 0 && resumeTime < video.duration) {
        video.currentTime = resumeTime;
      }
      if (shouldAutoPlay) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    previousQualityRef.current = currentVariant.key;
    previousVideoKeyRef.current = videoKey;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, [currentVariant, videoKey]);

  const qualityButtons = variants.map((variant) => {
    const isActive = variant.key === currentVariant?.key;
    return (
      <button
        key={variant.key}
        type="button"
        onClick={() => onQualityChange(variant.key)}
        className={cn(
          "rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
          isActive
            ? "bg-emerald-500/80 text-white shadow-md shadow-emerald-500/30"
            : "bg-white/10 text-slate-200 hover:bg-white/20",
        )}
        aria-pressed={isActive}
      >
        {variant.label}
      </button>
    );
  });

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-900 shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-in-out dark:border-slate-800/80 dark:ring-white/10",
        isMini
          ? "fixed bottom-4 right-4 z-40 h-[100px] w-[180px] rounded-xl backdrop-blur-xl md:bottom-6 md:right-6 md:h-[124px] md:w-[220px]"
          : "w-full",
        isTheater
          ? "fixed inset-0 z-50 m-4 flex max-h-[90vh] items-center justify-center bg-slate-950/70 backdrop-blur"
          : "",
      )}
    >
      {isMini ? (
        <button
          type="button"
          onClick={onCloseMini}
          className="absolute right-2 top-2 z-20 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white shadow-lg transition hover:bg-black/90"
          aria-label="Close mini player"
        >
          ×
        </button>
      ) : null}

      <div
        className={cn(
          "relative aspect-video w-full bg-black/80 transition-opacity duration-200",
          isFading ? "opacity-0" : "opacity-100",
          isMini ? "h-full aspect-auto" : "",
        )}
      >
        <video
          ref={videoRef}
          poster={poster ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={title}
        >
          {currentVariant?.sources.map((source) => (
            <source key={`${currentVariant.key}-${source.type}`} src={source.src} type={source.type} />
          ))}
          Your browser does not support the video tag.
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <MonitorPlay className="h-4 w-4" aria-hidden="true" />
          <span className="line-clamp-1 max-w-[220px]">{title}</span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 backdrop-blur">
          {qualityButtons}
        </div>

        <button
          type="button"
          onClick={toggleTheater}
          className="absolute right-3 bottom-3 rounded-full bg-black/50 p-2 text-white shadow-lg transition hover:bg-black/70"
          aria-pressed={isTheater}
          aria-label="Toggle theater mode"
        >
          {isTheater ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
