"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface Trailer {
  title: string;
  videoUrl: string;
  poster?: string;
  thumbnail?: string;
}

interface GameTrailersSectionProps {
  mainTrailer: { title: string; videoUrl: string; poster: string };
  smallTrailers: { title: string; thumbnail: string; videoUrl: string }[];
}

const DEFAULT_AMBIENT = "rgba(255, 255, 255, 0.25)";

function useAmbientColor(source?: string) {
  const [color, setColor] = useState<string>(DEFAULT_AMBIENT);

  useEffect(() => {
    if (!source) {
      setColor(DEFAULT_AMBIENT);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = source;

    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas not supported");

        const width = (canvas.width = img.naturalWidth || img.width);
        const height = (canvas.height = img.naturalHeight || img.height);
        context.drawImage(img, 0, 0, width, height);

        const sampleSize = 10;
        const pixelData = context.getImageData(0, 0, sampleSize, sampleSize).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const pixelCount = pixelData.length / 4;

        for (let i = 0; i < pixelData.length; i += 4) {
          r += pixelData[i];
          g += pixelData[i + 1];
          b += pixelData[i + 2];
        }

        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        setColor(`rgba(${r}, ${g}, ${b}, 0.6)`);
      } catch (error) {
        console.error("Failed to extract ambient color", error);
        setColor(DEFAULT_AMBIENT);
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      setColor(DEFAULT_AMBIENT);
    };

    return () => {
      isMounted = false;
    };
  }, [source]);

  return color;
}

function ControlButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:bg-white/20"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

export default function GameTrailersSection({
  mainTrailer,
  smallTrailers,
}: GameTrailersSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const ambientColor = useAmbientColor(mainTrailer.poster);

  const glowStyle = useMemo(
    () => ({
      boxShadow: `0 0 120px 40px ${ambientColor}`,
      background: `radial-gradient(circle at 20% 20%, ${ambientColor}, transparent 45%), radial-gradient(circle at 80% 30%, ${ambientColor}, transparent 40%), radial-gradient(circle at 50% 80%, ${ambientColor}, transparent 35%)`,
    }),
    [ambientColor]
  );

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (autoplay) {
      const playPromise = videoRef.current.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
    } else {
      videoRef.current.pause();
    }
  }, [autoplay]);

  const handlePictureInPicture = async () => {
    if (!videoRef.current) return;
    const doc = document as Document & {
      pictureInPictureElement?: Element | null;
      exitPictureInPicture?: () => Promise<void>;
    };
    const vid = videoRef.current as HTMLVideoElement & {
      requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
    };

    try {
      if (doc.pictureInPictureElement && doc.exitPictureInPicture) {
        await doc.exitPictureInPicture();
      } else if (vid.requestPictureInPicture) {
        await vid.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP not available", error);
    }
  };

  const mainPoster = mainTrailer.poster;

  const renderSmallCard = (trailer: Trailer, index: number) => (
    <a
      key={`${trailer.videoUrl}-${index}`}
      href={trailer.videoUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.03]"
    >
      <div className="relative w-full overflow-hidden">
        <img
          src={trailer.thumbnail || trailer.poster || ""}
          alt={trailer.title}
          className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/50" />
      </div>
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white/80">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug text-white">{trailer.title}</p>
          <p className="text-xs text-white/70">Tap to watch</p>
        </div>
      </div>
    </a>
  );

  return (
    <section className="relative isolate flex w-full flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 text-white shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
      <div
        className="pointer-events-none absolute inset-0 blur-3xl transition-all duration-500"
        style={glowStyle}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4">
        <div className="absolute inset-0 overflow-hidden rounded-[36px]" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-40" />
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-40" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" aria-hidden />
          <div className="absolute inset-x-0 top-0 h-px bg-white/50" aria-hidden />
          <div className="absolute inset-x-[-30%] top-0 h-20 bg-white/40 blur-3xl" aria-hidden />

          <div className="relative flex flex-col gap-4 p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-black/50">
              <video
                ref={videoRef}
                poster={mainPoster}
                controls
                playsInline
                loop
                muted={muted}
                className="aspect-video h-full w-full rounded-[24px] object-cover"
                src={mainTrailer.videoUrl}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">IGDB Trailers & Clips</p>
                <h3 className="text-lg font-semibold text-white sm:text-xl">{mainTrailer.title}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <ControlButton
                  label={autoplay ? "Autoplay On" : "Autoplay Off"}
                  icon={autoplay ? "▶" : "⏸"}
                  onClick={() => setAutoplay((prev) => !prev)}
                />
                <ControlButton
                  label={muted ? "Sound Off" : "Sound On"}
                  icon={muted ? "🔇" : "🔊"}
                  onClick={() => setMuted((prev) => !prev)}
                />
                <ControlButton
                  label={`${playbackRate}x`}
                  icon="⏩"
                  onClick={() => {
                    const nextRate = playbackRate >= 2 ? 0.75 : Math.min(playbackRate + 0.25, 2);
                    setPlaybackRate(Number(nextRate.toFixed(2)));
                  }}
                />
                <ControlButton label="PiP" icon="📺" onClick={handlePictureInPicture} />
                <ControlButton
                  label="Open in YouTube"
                  icon="↗"
                  onClick={() => window.open(mainTrailer.videoUrl, "_blank")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {smallTrailers.slice(0, 4).map((trailer, index) => renderSmallCard(trailer, index))}
      </div>
    </section>
  );
}
