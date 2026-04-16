"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Expand,
  Loader2,
  Minimize2,
  MonitorPlay,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoKey: string;
  title: string;
  poster?: string | null;
  embedUrl: string;
  watchUrl: string;
  autoPlay: boolean;
  onAutoPlayChange: (value: boolean) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onEnded: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTheater: boolean;
  toggleTheater: () => void;
  isMini: boolean;
  onCloseMini: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_API_SRC = "https://www.youtube.com/iframe_api";
let ytApiPromise: Promise<any> | null = null;

function loadYoutubeApi(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable during SSR"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const handleReady = () => {
        if (window.YT?.Player) {
          resolve(window.YT);
        }
      };

      const existing = document.querySelector(`script[src="${YT_API_SRC}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", handleReady, { once: true });
        existing.addEventListener("error", () => reject(new Error("YouTube API failed to load")), { once: true });
      } else {
        const script = document.createElement("script");
        script.src = YT_API_SRC;
        script.async = true;
        script.onload = handleReady;
        script.onerror = () => reject(new Error("YouTube API failed to load"));
        document.body.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = handleReady;
    });
  }

  return ytApiPromise;
}

export function VideoPlayer({
  title,
  videoKey,
  poster,
  embedUrl,
  watchUrl,
  autoPlay,
  onAutoPlayChange,
  playbackRate,
  onPlaybackRateChange,
  onEnded,
  onSwipeLeft,
  onSwipeRight,
  isTheater,
  toggleTheater,
  isMini,
  onCloseMini,
}: VideoPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialEmbedUrlRef = useRef(embedUrl);
  const playerRef = useRef<any>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useSwipeNavigation(wrapperRef, { onSwipeLeft, onSwipeRight });

  useEffect(() => {
    setIsFading(true);
    const id = window.setTimeout(() => setIsFading(false), 180);
    return () => window.clearTimeout(id);
  }, [videoKey]);

  useEffect(() => {
    let cancelled = false;
    setIsBuffering(true);

    loadYoutubeApi()
      .then((YT) => {
        if (cancelled || !iframeRef.current) return;

        const onPlayerReady = (event: any) => {
          if (cancelled) return;
          setIsBuffering(false);
          try {
            event.target.setPlaybackRate(playbackRate);
            if (autoPlay) {
              event.target[isMuted ? "mute" : "unMute"]?.();
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          } catch {
            /* ignored */
          }
        };

        const onStateChange = (event: any) => {
          const state = event.data;
          const playerState = YT?.PlayerState;
          if (playerState && state === playerState.ENDED) {
            setIsBuffering(false);
            onEnded();
          } else if (playerState && (state === playerState.BUFFERING || state === playerState.UNSTARTED)) {
            setIsBuffering(true);
          } else if (playerState && (state === playerState.PLAYING || state === playerState.PAUSED)) {
            setIsBuffering(false);
          }
        };

        const onError = () => setIsBuffering(false);

        if (playerRef.current) {
          const currentId = playerRef.current.getVideoData?.()?.video_id;
          if (currentId !== videoKey) {
            playerRef.current.loadVideoById(videoKey);
          }
          onPlayerReady({ target: playerRef.current });
          return;
        }

        playerRef.current = new YT.Player(iframeRef.current, {
          videoId: videoKey,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange,
            onError,
          },
        });
      })
      .catch(() => setIsBuffering(false));

    return () => {
      cancelled = true;
    };
  }, [autoPlay, isMuted, onEnded, playbackRate, videoKey]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.setPlaybackRate(playbackRate);
    } catch {
      /* ignored */
    }
  }, [playbackRate]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (autoPlay) {
        player.playVideo?.();
      } else {
        player.pauseVideo?.();
      }
    } catch {
      /* ignored */
    }
  }, [autoPlay]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isMuted) {
        player.mute?.();
      } else {
        player.unMute?.();
      }
    } catch {
      /* ignored */
    }
  }, [isMuted]);

  const handleAutoPlayToggle = () => {
    const next = !autoPlay;
    onAutoPlayChange(next);
  };

  const handleSoundToggle = () => {
    setIsMuted((value) => !value);
  };

  const handleSpeedChange = (rate: number) => {
    onPlaybackRateChange(rate);
  };

  const handlePictureInPicture = async () => {
    const iframe = playerRef.current?.getIframe?.() as HTMLIFrameElement | undefined;
    if (!iframe) return;

    if ("requestPictureInPicture" in iframe) {
      try {
        await (iframe as any).requestPictureInPicture();
      } catch {
        /* ignored */
      }
    }
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-900 shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-in-out dark:border-slate-800/80 dark:ring-white/10",
        isMini
          ? "fixed bottom-4 right-4 z-40 h-[100px] w-[180px] rounded-xl backdrop-blur-xl md:bottom-6 md:right-6 md:h-[124px] md:w-[220px]"
          : "w-full",
        isTheater ? "fixed inset-0 z-50 m-4 flex max-h-[90vh] items-center justify-center bg-slate-950/70 backdrop-blur" : "",
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
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              <iframe
                ref={iframeRef}
                title={title}
                src={initialEmbedUrlRef.current}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
              {poster ? (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 transition-opacity duration-300",
                    isBuffering ? "opacity-40" : "opacity-0",
                  )}
                >
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <MonitorPlay className="h-4 w-4" aria-hidden="true" />
          <span className="line-clamp-1 max-w-[220px]">{title}</span>
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

        {isBuffering ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 backdrop-blur">
        <button
          type="button"
          onClick={handleAutoPlayToggle}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition",
            autoPlay ? "bg-emerald-500/80 text-white" : "bg-white/10 text-slate-200 hover:bg-white/20",
          )}
          aria-pressed={autoPlay}
        >
          <Play className="h-3.5 w-3.5" />
          AutoPlay
        </button>

        <button
          type="button"
          onClick={handleSoundToggle}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition",
            isMuted ? "bg-white/10 text-slate-200 hover:bg-white/20" : "bg-emerald-500/80 text-white",
          )}
          aria-pressed={!isMuted}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {isMuted ? "Sound Off" : "Sound On"}
        </button>

        <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-slate-100">
          <span className="text-[11px] font-semibold uppercase">Speed</span>
          <select
            className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold"
            value={playbackRate}
            onChange={(event) => handleSpeedChange(Number.parseFloat(event.target.value))}
          >
            {speedOptions.map((rate) => (
              <option key={rate} value={rate}>
                {rate.toFixed(2)}x
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handlePictureInPicture}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 font-semibold text-slate-100 transition hover:bg-white/20"
        >
          <PictureInPicture2 className="h-3.5 w-3.5" />
          PiP
        </button>

        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 font-semibold text-slate-100 transition hover:bg-white/20"
        >
          Open in YouTube
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
