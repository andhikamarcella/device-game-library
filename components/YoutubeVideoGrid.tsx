"use client";

interface YoutubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnails: Record<string, { url: string }>;
}

interface YoutubeVideoGridProps {
  videos: YoutubeVideo[];
}

export function YoutubeVideoGrid({ videos }: YoutubeVideoGridProps) {
  if (!videos.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Gameplay videos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((video) => (
          <div key={video.videoId} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${video.videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-64 w-full"
            />
            <div className="p-3 text-sm">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{video.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
