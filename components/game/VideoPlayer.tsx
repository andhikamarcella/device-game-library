"use client";

export function VideoPlayer({ title, videoUrl, preview }: { title: string; videoUrl: string; preview?: string | null }) {
  if (!videoUrl) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950/70 shadow-xl shadow-slate-950/40 dark:border-slate-700">
      <video
        controls
        preload="metadata"
        poster={preview ?? undefined}
        className="h-full w-full"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support embedded videos.
      </video>
      <div className="p-4 text-sm text-slate-300">{title}</div>
    </div>
  );
}
