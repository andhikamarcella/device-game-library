"use client";

import type { VideoSource } from "@/lib/types";

export function VideoPlayer({ source }: { source?: VideoSource }) {
  if (!source) {
    return null;
  }

  if (source.type === "youtube") {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950/70 shadow-xl shadow-slate-950/40 dark:border-slate-700">
        <iframe
          title={source.title ?? "Gameplay video"}
          src={source.url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-64 w-full md:h-96"
        />
        {source.title && <div className="p-4 text-sm text-slate-300">{source.title}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950/70 shadow-xl shadow-slate-950/40 dark:border-slate-700">
      <video controls preload="metadata" poster={source.preview ?? undefined} className="h-full w-full">
        <source src={source.url} type="video/mp4" />
        Your browser does not support embedded videos.
      </video>
      {source.title && <div className="p-4 text-sm text-slate-300">{source.title}</div>}
    </div>
  );
}

