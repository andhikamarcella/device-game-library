"use client";

import React, { useMemo, useRef } from "react";

import useYouTubeAmbientLight from "../hooks/useYouTubeAmbientLight";

interface GameTrailersSectionProps {
  mainTrailer: { title: string; videoUrl: string; poster: string };
  smallTrailers: { title: string; thumbnail: string; videoUrl: string }[];
}

export default function GameTrailersSection({
  mainTrailer,
  smallTrailers,
}: GameTrailersSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ambientColor = useYouTubeAmbientLight(videoRef);

  const glassStyle = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(circle at 40% 0%, rgba(255,255,255,0.35), rgba(255,255,255,0.1) 60%, transparent 100%)",
      boxShadow: `0 30px 60px -10px rgba(0,0,0,0.35), 0 0 120px 40px ${ambientColor}`,
    }),
    [ambientColor]
  );

  const ambientGlowStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at center, ${ambientColor} 0%, transparent 70%)`,
    }),
    [ambientColor]
  );

  const previewTrailers = smallTrailers.slice(0, 6);

  return (
    <section className="space-y-8">
      <div className="relative isolate overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4 shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(80,125,255,0.18),transparent_30%)]" aria-hidden />

        <div
          className="relative overflow-hidden rounded-[36px] border border-white/20 bg-white/10 backdrop-blur-[28px] transition-colors duration-500"
          style={glassStyle}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-white/70" aria-hidden />
          <div className="pointer-events-none absolute inset-x-[-20%] top-0 h-[90px] bg-white/20 blur-[40px] opacity-40" aria-hidden />
          <div className="pointer-events-none absolute inset-0 blur-[85px] opacity-70" style={ambientGlowStyle} aria-hidden />

          <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                IGDB Trailers & Clips
              </p>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">{mainTrailer.title}</h3>
              <p className="text-sm text-white/70">Experience cinematic trailers with ambient lighting.</p>
            </div>

            <div className="relative overflow-hidden rounded-[36px] border border-white/25 bg-black/60 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
              <video
                ref={videoRef}
                poster={mainTrailer.poster}
                controls
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                className="aspect-video h-full w-full rounded-[36px] object-cover"
                src={mainTrailer.videoUrl}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40" aria-hidden />
            </div>

            <div className="flex flex-wrap gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-white/80">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">▶</span>
                <div>
                  <p className="text-sm font-semibold">Autoplay-ready experience</p>
                  <p className="text-xs text-white/60">Use native controls for speed, PiP, and captions.</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-white/60">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ambient light active
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewTrailers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {previewTrailers.map((trailer, index) => (
            <a
              key={`${trailer.videoUrl}-${index}`}
              href={trailer.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.03]"
            >
              <div className="relative w-full overflow-hidden">
                <img
                  src={trailer.thumbnail || mainTrailer.poster}
                  alt={trailer.title}
                  className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/50" />
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/80">
                  #{index + 1}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 px-4 py-3 text-white">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{trailer.title}</p>
                <p className="text-xs text-white/70">Tap to open</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
