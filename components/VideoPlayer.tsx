"use client";

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  title: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg dark:border-slate-800">
      <video
        controls
        poster={poster ?? undefined}
        className="h-full w-full"
        preload="metadata"
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
